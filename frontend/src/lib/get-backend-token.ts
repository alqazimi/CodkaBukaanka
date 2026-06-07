import type { JWT } from "next-auth/jwt";
import { cookies } from "next/headers";
import { getJwtExpiryMs, isBackendTokenExpired } from "./jwt-expiry";
import {
  readSessionJwtFromCookieHeader,
  sessionCookieCandidates,
} from "./read-session-jwt";

function buildCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

async function readSessionJwtFromCookie(
  cookieName: string,
  cookieHeader: string
): Promise<JWT | null> {
  return readSessionJwtFromCookieHeader(cookieHeader, cookieName);
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

  for (const cookieName of sessionCookieCandidates()) {
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
