function ensureHttpsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, "");
  return `https://${trimmed.replace(/^\/+/, "").replace(/\/$/, "")}`;
}

function productionApiOrigin(): string | null {
  const api = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
  if (!api) return null;
  try {
    return new URL(ensureHttpsUrl(api)).origin;
  } catch {
    return null;
  }
}

function productionConnectSrc(): string {
  const apiOrigin = productionApiOrigin();
  const turnstile = "https://challenges.cloudflare.com";
  if (apiOrigin) return `'self' ${apiOrigin} ${turnstile}`;
  return `'self' ${turnstile}`;
}

function productionMediaSrc(): string {
  const apiOrigin = productionApiOrigin();
  const base = "'self' data: blob:";
  const cloudinary = "https://res.cloudinary.com";
  return apiOrigin ? `${base} ${cloudinary} ${apiOrigin}` : `${base} ${cloudinary}`;
}

/** Per-request CSP with nonce — requires force-dynamic rendering (see root layout). */
export function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    // strict-dynamic: host allowlist ignored; every script needs a matching nonce (Next.js + Turnstile).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "frame-src https://challenges.cloudflare.com",
    `img-src ${productionMediaSrc()}`,
    `media-src ${productionMediaSrc()}`,
    `connect-src ${productionConnectSrc()}`,
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}
