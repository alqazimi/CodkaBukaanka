import { getPublicApiUrl } from "@/lib/env";
import { evidenceOriginalUrl } from "@/lib/evidence-display-url";

/** Turn stored evidence URL into an absolute HTTPS (or dev HTTP) URL */
export function resolveEvidenceAbsoluteUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.startsWith("/")) {
      const base = getPublicApiUrl().replace(/\/$/, "");
      return `${base}${trimmed}`;
    }

    const parsed = new URL(trimmed);
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev && parsed.protocol !== "https:") return null;
    if (isDev && parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

/** Same-site link that redirects to the real file (works for Railway + Cloudinary) */
export function getEvidenceOpenHref(url: string): string | null {
  const absolute = resolveEvidenceAbsoluteUrl(url);
  if (!absolute) return null;
  return `/api/evidence/open?u=${encodeURIComponent(absolute)}`;
}

/** Final URL after optional Cloudinary transform strip */
export function resolveEvidenceOpenTarget(url: string): string | null {
  const absolute = resolveEvidenceAbsoluteUrl(url);
  if (!absolute) return null;
  return evidenceOriginalUrl(absolute);
}
