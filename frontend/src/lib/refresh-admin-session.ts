import { encode, getToken } from "next-auth/jwt";
import { ensureHttpsUrl, getAuthSecret, getServerApiUrl } from "@/lib/env";
import { ADMIN_SESSION_MAX_AGE_SEC } from "@/lib/admin-session";
import { getSessionCookieName } from "@/lib/auth-cookies";

export async function refreshBackendAccessToken(currentToken: string): Promise<string | null> {
  const url = new URL("api/auth/refresh", `${ensureHttpsUrl(getServerApiUrl())}/`).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${currentToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const newToken = res.headers.get("x-auth-token");
  return typeof newToken === "string" && newToken.length > 0 ? newToken : null;
}

export async function encodeSessionWithAccessToken(
  cookieHeader: string,
  newAccessToken: string
): Promise<{ cookieName: string; value: string } | null> {
  const secure = process.env.NODE_ENV === "production";
  const cookieName = getSessionCookieName(secure);
  const token = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret: getAuthSecret(),
    secureCookie: secure,
    cookieName,
    salt: cookieName,
  });
  if (!token) return null;

  const value = await encode({
    token: { ...token, accessToken: newAccessToken },
    secret: getAuthSecret(),
    salt: cookieName,
    maxAge: ADMIN_SESSION_MAX_AGE_SEC,
  });

  return { cookieName, value };
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
