const DEV_API = "http://localhost:4000";
const DEV_SITE = "http://localhost:3000";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/** Ensure absolute URL — Vercel env vars are sometimes pasted without https:// */
export function ensureHttpsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) {
    return stripTrailingSlash(trimmed);
  }
  // Hostname only (e.g. xxx.up.railway.app) — default to HTTPS in production
  return stripTrailingSlash(`https://${trimmed.replace(/^\/+/, "")}`);
}

/** True while `next build` is collecting static pages (not at request time). */
function isNextProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/** Vercel injects VERCEL_URL / VERCEL_PROJECT_PRODUCTION_URL automatically. */
function vercelPublicOrigin(): string | undefined {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();
  if (!host) return undefined;
  if (host.startsWith("http://") || host.startsWith("https://")) {
    return stripTrailingSlash(host);
  }
  return `https://${host}`;
}

function isLocalhostUrl(url: string): boolean {
  return /\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url);
}

function requireEnv(
  name: string,
  value: string | undefined,
  devFallback: string,
  options?: { vercelOriginFallback?: boolean; buildPlaceholder?: string }
): string {
  const vercelOrigin = options?.vercelOriginFallback ? vercelPublicOrigin() : undefined;

  if (value?.trim()) {
    const resolved = ensureHttpsUrl(value);
    if (process.env.NODE_ENV === "production" && isLocalhostUrl(resolved) && vercelOrigin) {
      return vercelOrigin;
    }
    return resolved;
  }
  if (process.env.NODE_ENV !== "production") return devFallback;

  if (vercelOrigin) return vercelOrigin;

  if (options?.buildPlaceholder && isNextProductionBuild()) {
    return options.buildPlaceholder;
  }

  throw new Error(
    `${name} must be set in Vercel → Project → Settings → Environment Variables (Production). See PRODUCTION_ENV.md.`
  );
}

/** Server-side API base URL (Railway backend) */
export function getServerApiUrl(): string {
  return requireEnv(
    "API_URL",
    process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    DEV_API,
    { buildPlaceholder: "http://127.0.0.1:65530" }
  );
}

/** Browser / client API base URL */
export function getPublicApiUrl(): string {
  return requireEnv(
    "NEXT_PUBLIC_API_URL",
    process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL,
    DEV_API,
    { buildPlaceholder: "http://127.0.0.1:65530" }
  );
}

/** Public site URL (Vercel frontend) */
export function getSiteUrl(): string {
  return requireEnv(
    "NEXT_PUBLIC_SITE_URL",
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL,
    DEV_SITE,
    { vercelOriginFallback: true }
  );
}

/** NextAuth secret — validated at sign-in, not during static build. */
export function getAuthSecret(): string {
  const secret = tryGetAuthSecret();
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "development-auth-secret-not-for-production-use";
  }
  if (isNextProductionBuild()) {
    return "build-time-auth-secret-placeholder-32chars";
  }
  throw new Error(
    "AUTH_SECRET must be at least 32 characters in production. Set it in Vercel environment variables."
  );
}

/** Non-throwing lookup — use when auth may be misconfigured (session probes, JWT decode). */
export function tryGetAuthSecret(): string | null {
  const secret =
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "";
  return secret.length >= 32 ? secret : null;
}
