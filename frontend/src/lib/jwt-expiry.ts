/** Decode JWT `exp` without verifying signature (used only for refresh timing). */
export function getJwtExpiryMs(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    ) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
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
