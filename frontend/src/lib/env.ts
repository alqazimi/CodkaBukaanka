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

export type AuthSecretEnvDiagnostics = {
  /** Env key present (may be empty or whitespace). */
  AUTH_SECRET: boolean;
  /** Trimmed value is non-empty. */
  AUTH_SECRET_nonempty: boolean;
  /** Trimmed length ≥ 32 (Auth.js + our validation). */
  AUTH_SECRET_length_ok: boolean;
  AUTH_SECRET_length: number;
  NEXTAUTH_SECRET: boolean;
  NEXTAUTH_SECRET_nonempty: boolean;
  NEXTAUTH_SECRET_length_ok: boolean;
  NEXTAUTH_SECRET_length: number;
  /** Which key would be used after trim (no values exposed). */
  resolved_from: "AUTH_SECRET" | "NEXTAUTH_SECRET" | "none";
  VERCEL_ENV: string | null;
};

/** Safe runtime probe — booleans and lengths only, never secret values. */
export function getAuthSecretEnvDiagnostics(): AuthSecretEnvDiagnostics {
  const authRaw = process.env.AUTH_SECRET;
  const nextRaw = process.env.NEXTAUTH_SECRET;
  const authTrim = authRaw?.trim() ?? "";
  const nextTrim = nextRaw?.trim() ?? "";

  const resolved =
    authTrim.length >= 32
      ? "AUTH_SECRET"
      : nextTrim.length >= 32
        ? "NEXTAUTH_SECRET"
        : authTrim.length > 0
          ? "AUTH_SECRET"
          : nextTrim.length > 0
            ? "NEXTAUTH_SECRET"
            : "none";

  return {
    AUTH_SECRET: authRaw !== undefined,
    AUTH_SECRET_nonempty: authTrim.length > 0,
    AUTH_SECRET_length_ok: authTrim.length >= 32,
    AUTH_SECRET_length: authTrim.length,
    NEXTAUTH_SECRET: nextRaw !== undefined,
    NEXTAUTH_SECRET_nonempty: nextTrim.length > 0,
    NEXTAUTH_SECRET_length_ok: nextTrim.length >= 32,
    NEXTAUTH_SECRET_length: nextTrim.length,
    resolved_from: resolved,
    VERCEL_ENV: process.env.VERCEL_ENV?.trim() || null,
  };
}

/** Log auth secret env presence at server startup (never log values). */
export function logAuthSecretEnvPresence(): void {
  const d = getAuthSecretEnvDiagnostics();
  console.info(
    `[auth][env] AUTH_SECRET: ${d.AUTH_SECRET_nonempty} (length_ok: ${d.AUTH_SECRET_length_ok}, len: ${d.AUTH_SECRET_length})`
  );
  console.info(
    `[auth][env] NEXTAUTH_SECRET: ${d.NEXTAUTH_SECRET_nonempty} (length_ok: ${d.NEXTAUTH_SECRET_length_ok}, len: ${d.NEXTAUTH_SECRET_length})`
  );
  if (d.VERCEL_ENV) console.info(`[auth][env] VERCEL_ENV: ${d.VERCEL_ENV}`);
}
