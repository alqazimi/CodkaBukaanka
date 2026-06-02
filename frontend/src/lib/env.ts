const DEV_API = "http://localhost:4000";
const DEV_SITE = "http://localhost:3000";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function requireEnv(name: string, value: string | undefined, devFallback: string): string {
  if (value?.trim()) return stripTrailingSlash(value.trim());
  if (process.env.NODE_ENV !== "production") return devFallback;
  throw new Error(`${name} must be set in production (Vercel environment variables).`);
}

/** Server-side API base URL (Railway backend) */
export function getServerApiUrl(): string {
  return requireEnv("API_URL", process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL, DEV_API);
}

/** Browser / client API base URL */
export function getPublicApiUrl(): string {
  return requireEnv(
    "NEXT_PUBLIC_API_URL",
    process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL,
    DEV_API
  );
}

/** Public site URL (Vercel frontend) */
export function getSiteUrl(): string {
  return requireEnv(
    "NEXT_PUBLIC_SITE_URL",
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL,
    DEV_SITE
  );
}
