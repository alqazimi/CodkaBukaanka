import type { JWT } from "next-auth/jwt";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { getSessionCookieName, LEGACY_SESSION_COOKIE_NAMES } from "./auth-cookies";
import { getAuthSecret } from "./env";
import { getJwtExpiryMs, isBackendTokenExpired } from "./jwt-expiry";

function buildCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

const SESSION_COOKIE_CANDIDATES = (): string[] => [
  getSessionCookieName(),
  ...LEGACY_SESSION_COOKIE_NAMES,
];

async function readSessionJwtFromCookie(
  cookieName: string,
  cookieHeader: string
): Promise<JWT | null> {
  const secureCookie = process.env.NODE_ENV === "production";
  const token = await getToken({
    req: { headers: { cookie: cookieHeader } },
    secret: getAuthSecret(),
    secureCookie,
    cookieName,
    salt: cookieName,
  });
  return token ?? null;
}

type SessionCandidate = {
  cookieName: string;
  jwt: JWT;
  accessToken: string;
  accessExp: number;
  issuedAt: number;
};

/** Prefer the newest session cookie and a non-expired backend JWT when multiple exist. */
export async function readAdminSessionCookie(): Promise<SessionCandidate | null> {
  const cookieStore = await cookies();
  const cookieHeader = buildCookieHeader(cookieStore);
  if (!cookieHeader) return null;

  let best: SessionCandidate | null = null;

  for (const cookieName of SESSION_COOKIE_CANDIDATES()) {
    const jwt = await readSessionJwtFromCookie(cookieName, cookieHeader);
    if (!jwt) continue;
    const accessToken = jwt.accessToken;
    if (typeof accessToken !== "string" || accessToken.length === 0) continue;

    const accessExp = getJwtExpiryMs(accessToken) ?? 0;
    const issuedAt = typeof jwt.iat === "number" ? jwt.iat : 0;
    const candidate: SessionCandidate = { cookieName, jwt, accessToken, accessExp, issuedAt };

    if (!best) {
      best = candidate;
      continue;
    }

    const bestExpired = isBackendTokenExpired(best.accessToken);
    const candidateExpired = isBackendTokenExpired(candidate.accessToken);

    if (bestExpired && !candidateExpired) {
      best = candidate;
      continue;
    }
    if (!bestExpired && candidateExpired) {
      continue;
    }
    if (candidate.issuedAt > best.issuedAt) {
      best = candidate;
      continue;
    }
    if (candidate.issuedAt === best.issuedAt && candidate.accessExp > best.accessExp) {
      best = candidate;
    }
  }

  return best;
}

export async function getBackendAccessToken(): Promise<string | undefined> {
  const session = await readAdminSessionCookie();
  return session?.accessToken;
}
