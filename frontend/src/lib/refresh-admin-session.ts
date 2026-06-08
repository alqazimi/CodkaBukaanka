import { encode, getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { ensureHttpsUrl, getAuthSigningSecret, getServerApiUrl } from "@/lib/env";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/admin-session";
import { getSessionHardExpiryMs, getJwtAdminClaims } from "@/lib/jwt-expiry";
import { normalizeAdminRole } from "@/lib/admin-role";
import { getSessionCookieName } from "@/lib/auth-cookies";
import { secureCookieForName } from "@/lib/read-session-jwt";
import { readAdminSessionCookie } from "@/lib/get-backend-token";

export async function refreshBackendAccessToken(currentToken: string): Promise<{
  accessToken: string;
  user?: { role?: string; requiresMfaSetup?: boolean };
} | null> {
  const url = new URL("api/auth/refresh", `${ensureHttpsUrl(getServerApiUrl())}/`).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${currentToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const newToken = res.headers.get("x-auth-token");
  if (typeof newToken !== "string" || newToken.length === 0) return null;
  let user: { role?: string; requiresMfaSetup?: boolean } | undefined;
  try {
    const body = (await res.json()) as {
      user?: { role?: string; requiresMfaSetup?: boolean };
    };
    user = body.user;
  } catch {
    user = undefined;
  }
  return { accessToken: newToken, user };
}

export async function encodeSessionWithAccessToken(
  cookieHeader: string,
  newAccessToken: string,
  preferredCookieName?: string,
  profile?: { role?: string; requiresMfaSetup?: boolean }
): Promise<{ cookieName: string; value: string } | null> {
  const secure = process.env.NODE_ENV === "production";
  const cookieName = preferredCookieName ?? getSessionCookieName(secure);
  const secret = getAuthSigningSecret();
  if (!secret) return null;

  const token = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret,
    secureCookie: secureCookieForName(cookieName),
    cookieName,
    salt: cookieName,
  });
  if (!token) return null;

  const claims = getJwtAdminClaims(newAccessToken);
  const roleFromJwt = normalizeAdminRole(claims?.role ?? profile?.role);
  const roleFromProfile = normalizeAdminRole(profile?.role);

  const value = await encode({
    token: {
      ...token,
      accessToken: newAccessToken,
      sessionHardExpMs: getSessionHardExpiryMs(newAccessToken, ADMIN_SESSION_MAX_AGE_SEC) ?? undefined,
      ...(roleFromJwt ? { role: roleFromJwt } : roleFromProfile ? { role: roleFromProfile } : {}),
      ...(typeof profile?.requiresMfaSetup === "boolean"
        ? { requiresMfaSetup: profile.requiresMfaSetup }
        : {}),
    },
    secret,
    salt: cookieName,
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  });

  return { cookieName, value };
}

export async function encodeCurrentSessionWithAccessToken(
  newAccessToken: string
): Promise<{ cookieName: string; value: string } | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  if (!cookieHeader) return null;

  const session = await readAdminSessionCookie();
  return encodeSessionWithAccessToken(
    cookieHeader,
    newAccessToken,
    session?.cookieName
  );
}

export function sessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    path: "/",
    secure,
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  };
}
