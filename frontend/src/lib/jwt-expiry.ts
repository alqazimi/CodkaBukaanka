/** Decode JWT claims without verifying signature (refresh timing + role sync only). */
export type JwtAdminClaims = {
  exp?: number;
  ss?: number;
  iat?: number;
  role?: string;
};

export function getJwtAdminClaims(token: string): JwtAdminClaims | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as JwtAdminClaims;
  } catch {
    return null;
  }
}

/** @deprecated Use getJwtAdminClaims */
export function getJwtPayload(token: string): { exp?: number; ss?: number; iat?: number } | null {
  return getJwtAdminClaims(token);
}

export function getJwtExpiryMs(token: string): number | null {
  const payload = getJwtAdminClaims(token);
  return typeof payload?.exp === "number" ? payload.exp * 1000 : null;
}

/** Absolute session end from login time (`ss` claim + max age). */
export function getSessionHardExpiryMs(token: string, maxAgeSec: number): number | null {
  const payload = getJwtAdminClaims(token);
  if (!payload) return null;
  const sessionStart = payload.ss ?? payload.iat;
  if (typeof sessionStart !== "number") return null;
  return (sessionStart + maxAgeSec) * 1000;
}

export function isBackendTokenExpiringSoon(token: string, withinMs: number): boolean {
  const exp = getJwtExpiryMs(token);
  if (!exp) return false;
  return exp - Date.now() <= withinMs;
}

export function isBackendTokenExpired(token: string, graceMs = 0): boolean {
  const exp = getJwtExpiryMs(token);
  if (!exp) return false;
  return Date.now() > exp + graceMs;
}
