import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { getSessionCookieName, LEGACY_SESSION_COOKIE_NAMES } from "./auth-cookies";
import { getAuthSecret } from "./env";

function buildCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

async function readAccessTokenFromCookie(cookieName: string, cookieHeader: string): Promise<string | undefined> {
  const secureCookie = process.env.NODE_ENV === "production";
  const token = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret: getAuthSecret(),
    secureCookie,
    cookieName,
    salt: cookieName,
  });
  const accessToken = token?.accessToken;
  return typeof accessToken === "string" && accessToken.length > 0 ? accessToken : undefined;
}

export async function getBackendAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore);
  if (!cookieHeader) return undefined;

  const primary = getSessionCookieName();
  const fromPrimary = await readAccessTokenFromCookie(primary, cookieHeader);
  if (fromPrimary) return fromPrimary;

  for (const legacyName of LEGACY_SESSION_COOKIE_NAMES) {
    const legacy = await readAccessTokenFromCookie(legacyName, cookieHeader);
    if (legacy) return legacy;
  }

  return undefined;
}
