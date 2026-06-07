const DEFAULT_CANONICAL_HOST = "www.codkabukaanka.com";

export function getCanonicalHost(): string {
  const raw = process.env.NEXT_PUBLIC_CANONICAL_HOST?.trim().toLowerCase();
  if (!raw) return DEFAULT_CANONICAL_HOST;
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "").split(":")[0] ?? DEFAULT_CANONICAL_HOST;
}

/** Production only — one canonical HTTPS host (prevents duplicate-domain trust issues). */
export function shouldEnforceCanonicalHost(): boolean {
  return process.env.NODE_ENV === "production" && process.env.VERCEL_ENV !== "preview";
}

export function isCanonicalHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalized = host.toLowerCase().split(":")[0] ?? "";
  return normalized === getCanonicalHost();
}
