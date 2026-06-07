import type { JWT } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { getSessionCookieName, LEGACY_SESSION_COOKIE_NAMES } from "./auth-cookies";
import { getAuthSecret } from "./env";

export function sessionCookieCandidates(): string[] {
  return [getSessionCookieName(), ...LEGACY_SESSION_COOKIE_NAMES];
}

export function secureCookieForName(cookieName: string): boolean {
  return cookieName.startsWith("__Secure-") || cookieName.startsWith("__Host-");
}

export async function readSessionJwtFromRequest(
  request: NextRequest,
  cookieName: string
): Promise<JWT | null> {
  if (!request.cookies.get(cookieName)?.value) return null;

  try {
    const token = await getToken({
      req: request,
      secret: getAuthSecret(),
      cookieName,
      secureCookie: secureCookieForName(cookieName),
      salt: cookieName,
    });
    return token ?? null;
  } catch {
    return null;
  }
}

export async function readSessionJwtFromCookieHeader(
  cookieHeader: string,
  cookieName: string
): Promise<JWT | null> {
  if (!cookieHeader.includes(`${cookieName}=`)) return null;

  try {
    const token = await getToken({
      req: { headers: { cookie: cookieHeader } },
      secret: getAuthSecret(),
      cookieName,
      secureCookie: secureCookieForName(cookieName),
      salt: cookieName,
    });
    return token ?? null;
  } catch {
    return null;
  }
}

export function isValidAdminSessionJwt(token: JWT): boolean {
  const userId = token.sub ?? token.id;
  const accessToken = token.accessToken;
  if (!userId || typeof accessToken !== "string" || accessToken.length === 0) return false;
  if (typeof token.sessionHardExpMs === "number" && Date.now() > token.sessionHardExpMs) {
    return false;
  }
  return true;
}
