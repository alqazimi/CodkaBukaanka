/** Decode JWT `exp` without verifying signature (used only for refresh timing). */
export function getJwtPayload(token: string): { exp?: number; ss?: number; iat?: number } | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as { exp?: number; ss?: number; iat?: number };
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token: string): number | null {
  const payload = getJwtPayload(token);
  return typeof payload?.exp === "number" ? payload.exp * 1000 : null;
}

/** Absolute session end from login time (`ss` claim + max age). */
export function getSessionHardExpiryMs(token: string, maxAgeSec: number): number | null {
  const payload = getJwtPayload(token);
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
