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
  if (apiOrigin) return `'self' ${apiOrigin} https:`;
  return "'self' https:";
}

function productionMediaSrc(): string {
  const apiOrigin = productionApiOrigin();
  const base = "'self' data: blob: https:";
  return apiOrigin ? `${base} ${apiOrigin}` : base;
}

/** Per-request CSP with nonce — no script 'unsafe-inline' in production. */
export function buildContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com`,
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
  ].join("; ");
}
