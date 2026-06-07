import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/admin-session";
import { getSessionCookieName } from "@/lib/auth-cookies";
import { ensureHttpsUrl, getAuthSecret, getServerApiUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";
import { buildLoginProxyHeaders } from "@/lib/login-proxy-headers";

class AdminLoginFailed extends CredentialsSignin {
  code = "invalid_credentials";
}

class AdminApiUnreachable extends CredentialsSignin {
  code = "api_unreachable";
}

class AdminInvalidLoginResponse extends CredentialsSignin {
  code = "invalid_response";
}

class AdminOriginBlocked extends CredentialsSignin {
  code = "origin_blocked";
}

class AdminRequireCaptcha extends CredentialsSignin {
  code = "require_captcha";
}

class AdminCaptchaNotConfigured extends CredentialsSignin {
  code = "captcha_not_configured";
}

class AdminAccountLocked extends CredentialsSignin {
  code = "account_locked";
}

class AdminIpBlocked extends CredentialsSignin {
  code = "ip_blocked";
}

class AdminMfaInvalid extends CredentialsSignin {
  code = "mfa_invalid";
}

function throwLoginFailure(status: number, apiCode?: string): never {
  if (status === 403) throw new AdminOriginBlocked();
  if (status === 429 && (apiCode === "ip_blocked" || apiCode === "account_locked")) {
    if (apiCode === "account_locked") throw new AdminAccountLocked();
    throw new AdminIpBlocked();
  }
  switch (apiCode) {
    case "require_captcha":
      throw new AdminRequireCaptcha();
    case "captcha_not_configured":
      throw new AdminCaptchaNotConfigured();
    case "account_locked":
      throw new AdminAccountLocked();
    case "ip_blocked":
      throw new AdminIpBlocked();
    case "mfa_invalid":
      throw new AdminMfaInvalid();
    default:
      throw new AdminLoginFailed();
  }
}

const isProduction = process.env.NODE_ENV === "production";
const sessionCookieName = getSessionCookieName(isProduction);

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: getAuthSecret(),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpToken: { label: "TOTP", type: "text" },
        captchaToken: { label: "Captcha", type: "text" },
      },
      async authorize(credentials) {
        const secret = process.env.AUTH_SECRET?.trim() ?? "";
        if (isProduction && secret.length < 32) {
          throw new Error(
            "AUTH_SECRET is missing or too short on Vercel. Add a 32+ character secret in Environment Variables."
          );
        }

        const API_URL = getServerApiUrl();
        if (!credentials?.email || !credentials?.password) return null;
        const totpToken =
          typeof credentials.totpToken === "string" && credentials.totpToken.trim().length > 0
            ? credentials.totpToken.trim()
            : undefined;
        const captchaToken =
          typeof credentials.captchaToken === "string" && credentials.captchaToken.trim().length > 0
            ? credentials.captchaToken.trim()
            : undefined;
        let res: Response;
        try {
          const proxyHeaders = await buildLoginProxyHeaders();
          res = await fetch(new URL("/api/auth/login", `${ensureHttpsUrl(API_URL)}/`).toString(), {
            method: "POST",
            headers: proxyHeaders,
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              totpToken,
              captchaToken,
            }),
          });
        } catch {
          throw new AdminApiUnreachable();
        }

        const accessToken = res.headers.get("x-auth-token") ?? undefined;

        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
          user?: {
            id: string;
            email: string;
            name: string;
            role: string;
            requiresMfaSetup?: boolean;
          };
        };

        if (!res.ok) {
          throwLoginFailure(res.status, data.code);
        }

        if (!data.user?.id || !accessToken) {
          throw new AdminInvalidLoginResponse();
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          accessToken,
          requiresMfaSetup: data.user.requiresMfaSetup === true,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: ADMIN_SESSION_MAX_AGE_SEC, updateAge: 5 * 60 },
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: isProduction ? "__Host-next-auth.csrf-token" : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: isProduction,
      },
    },
  },
  pages: { signIn: "/admin/login" },
  callbacks: {
    /** Block open redirects — unvalidated callbackUrl is a common Safe Browsing / phishing flag on login pages. */
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const target = new URL(url);
        const base = new URL(baseUrl);
        if (target.origin === base.origin) return url;
      } catch {
        // Invalid URL — fall back to site home.
      }
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "admin";
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.requiresMfaSetup = (user as { requiresMfaSetup?: boolean }).requiresMfaSetup === true;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { requiresMfaSetup?: boolean; accessToken?: string };
        if (typeof patch.requiresMfaSetup === "boolean") {
          token.requiresMfaSetup = patch.requiresMfaSetup;
        }
        if (typeof patch.accessToken === "string" && patch.accessToken.length > 0) {
          token.accessToken = patch.accessToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session as { requiresMfaSetup?: boolean }).requiresMfaSetup =
          token.requiresMfaSetup === true;
      }
      return session;
    },
  },
  logger: {
    error(error) {
      const raw = error instanceof Error ? `${error.name} ${error.message}` : String(error);
      if (raw.includes("CredentialsSignin")) return;
      console.error("[auth][error]", error);
    },
  },
  trustHost: true,
});

export async function getAccessToken(): Promise<string | undefined> {
  return getBackendAccessToken();
}

export { getBackendAccessToken };
