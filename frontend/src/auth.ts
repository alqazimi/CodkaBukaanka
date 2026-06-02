import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/admin-session";
import { getServerApiUrl } from "@/lib/env";

const API_URL = getServerApiUrl();
const isProduction = process.env.NODE_ENV === "production";
const authSecret = process.env.AUTH_SECRET ?? "";

if (isProduction && authSecret.length < 32) {
  throw new Error("AUTH_SECRET must be at least 32 characters in production");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
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
          res = await fetch(`${API_URL}/api/auth/login`, {
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
          return null;
        }

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          accessToken: data.accessToken,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: ADMIN_SESSION_MAX_AGE_SEC },
  cookies: {
    sessionToken: {
      name: isProduction ? "__Secure-next-auth.session-token" : "next-auth.session-token",
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "admin";
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  logger: {
    error(error) {
      // Invalid credentials/MFA attempts are expected user errors.
      // Keep terminal clean and avoid noisy stack traces for these cases.
      const raw = error instanceof Error ? `${error.name} ${error.message}` : String(error);
      if (raw.includes("CredentialsSignin")) return;
      console.error("[auth][error]", error);
    },
  },
  trustHost: true,
});

export async function getAccessToken(): Promise<string | undefined> {
  const session = await auth();
  return (session as { accessToken?: string } | null)?.accessToken;
}
