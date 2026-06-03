import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/admin-session";
import { getSessionCookieName } from "@/lib/auth-cookies";
import { ensureHttpsUrl, getAuthSecret, getServerApiUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";

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
          res = await fetch(new URL("/api/auth/login", `${ensureHttpsUrl(API_URL)}/`).toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              totpToken,
              captchaToken,
            }),
          });
        } catch {
          throw new Error("Cannot reach API server. Check API_URL on Vercel points to your Railway backend.");
        }

        const accessToken = res.headers.get("x-auth-token") ?? undefined;

        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          user?: {
            id: string;
            email: string;
            name: string;
            role: string;
            requiresMfaSetup?: boolean;
          };
        };

        if (!res.ok) {
          throw new Error(data.error ?? "Invalid credentials");
        }

        if (!data.user?.id || !accessToken) {
          throw new Error("Invalid login response from API");
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
  session: { strategy: "jwt", maxAge: ADMIN_SESSION_MAX_AGE_SEC },
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "admin";
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.requiresMfaSetup = (user as { requiresMfaSetup?: boolean }).requiresMfaSetup === true;
      }
      if (trigger === "update" && session && typeof session === "object") {
        const patch = session as { requiresMfaSetup?: boolean };
        if (typeof patch.requiresMfaSetup === "boolean") {
          token.requiresMfaSetup = patch.requiresMfaSetup;
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
