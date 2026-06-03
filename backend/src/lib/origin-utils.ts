/** Normalize site URL to origin for CORS / origin policy checks. */
export function normalizeSiteOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

export function parseFrontendOrigins(
  frontendUrl: string,
  frontendUrls?: string
): string[] {
  const raw = (frontendUrls ?? frontendUrl)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  const origins = new Set<string>();
  for (const entry of raw) {
    const origin = normalizeSiteOrigin(entry);
    if (origin) origins.add(origin);
  }
  return [...origins];
}

export function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
  const normalized = normalizeSiteOrigin(origin);
  if (!normalized) return false;
  return allowedOrigins.includes(normalized);
}
