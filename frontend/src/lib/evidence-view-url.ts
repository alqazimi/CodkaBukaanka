import { isSafeExternalUrl } from "@/lib/safe-url";
import { evidenceImageUrl, isAllowedEvidenceMediaUrl } from "@/lib/evidence-display-url";
import { resolveEvidenceAbsoluteUrl } from "@/lib/evidence-open";

export type EvidenceImageSize = "thumb" | "preview";

function extractStreamKey(absolute: string, marker: string): string | null {
  const idx = absolute.indexOf(marker);
  if (idx < 0) return null;
  const raw = absolute.slice(idx + marker.length).split("?")[0]?.split("#")[0] ?? "";
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Same-origin proxy for streams that need auth or caching. */
export function evidenceStreamDisplaySrc(url: string): string {
  const absolute = resolveEvidenceAbsoluteUrl(url);
  if (!absolute) return url;

  const adminKey = extractStreamKey(absolute, "/api/admin/evidence/stream/");
  if (adminKey) {
    return `/api/admin-evidence/stream/${encodeURIComponent(adminKey)}`;
  }

  if (
    absolute.includes("/api/evidence/stream/") ||
    (isAllowedEvidenceMediaUrl(absolute) && !absolute.includes("res.cloudinary.com"))
  ) {
    return `/api/evidence-media?src=${encodeURIComponent(absolute)}`;
  }

  return absolute;
}

/** Image thumbnails and previews — Cloudinary transforms where possible. */
export function evidenceImageDisplaySrc(url: string, size: EvidenceImageSize = "preview"): string {
  const absolute = resolveEvidenceAbsoluteUrl(url);
  if (!absolute) return url;

  if (absolute.includes("/api/admin/evidence/stream/")) {
    return evidenceStreamDisplaySrc(url);
  }

  if (absolute.includes("res.cloudinary.com") && absolute.includes("/image/")) {
    return evidenceImageUrl(absolute, size);
  }

  if (absolute.includes("/api/evidence/stream/")) {
    return evidenceStreamDisplaySrc(url);
  }

  if (isAllowedEvidenceMediaUrl(absolute)) {
    return `/api/evidence-media?src=${encodeURIComponent(absolute)}`;
  }

  return absolute;
}

export function isDisplayableEvidenceUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (url.startsWith("/api/admin-evidence/") || url.startsWith("/api/evidence-media")) return true;
  const absolute = resolveEvidenceAbsoluteUrl(url);
  if (!absolute) return false;
  if (absolute.includes("/api/admin/evidence/stream/")) return true;
  return isSafeExternalUrl(absolute);
}
