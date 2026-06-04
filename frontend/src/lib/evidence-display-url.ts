import { isSafeExternalUrl } from "@/lib/safe-url";

/** Fixed preview heights (Tailwind-aligned) */
export const EVIDENCE_FRAME = {
  adminThumb: "h-40 md:h-44",
  reportFeatured: "min-h-[200px] h-56 sm:h-64 md:h-72",
  reportCard: "h-44 sm:h-48",
  gridCard: "h-44 sm:h-48",
} as const;

type EvidenceImageSize = "thumb" | "preview";

const CLOUDINARY_TRANSFORMS: Record<EvidenceImageSize, string> = {
  thumb: "c_limit,h_360,w_520,q_auto:good,f_auto",
  preview: "c_limit,h_720,w_1080,q_auto:good,f_auto",
};

/** Strip Cloudinary transforms so the browser loads the true uploaded file */
export function evidenceOriginalUrl(url: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  const uploadIdx = url.indexOf("/upload/");
  if (uploadIdx < 0) return url;
  const prefix = url.slice(0, uploadIdx + "/upload/".length);
  const after = url.slice(uploadIdx + "/upload/".length);
  const versionIdx = after.search(/\/?v\d+\//);
  if (versionIdx < 0) return url;
  const versionPart = after.slice(versionIdx).replace(/^\//, "");
  return `${prefix}${versionPart}`;
}

/** Resized URL for card thumbnails only — never use in lightbox */
export function evidenceImageUrl(url: string, size: EvidenceImageSize = "preview"): string {
  const original = evidenceOriginalUrl(url);
  if (!original.includes("res.cloudinary.com") || !original.includes("/upload/")) {
    return original;
  }
  const marker = "/upload/";
  const idx = original.indexOf(marker);
  if (idx < 0) return original;
  const prefix = original.slice(0, idx + marker.length);
  const rest = original.slice(idx + marker.length);
  if (!rest.startsWith("v")) return original;
  return `${prefix}${CLOUDINARY_TRANSFORMS[size]}/${rest}`;
}

function collectAllowedMediaHosts(): Set<string> {
  const hosts = new Set<string>(["res.cloudinary.com"]);
  for (const key of ["NEXT_PUBLIC_API_URL", "API_URL"] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
      hosts.add(new URL(normalized).hostname);
    } catch {
      // ignore
    }
  }
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) {
    try {
      hosts.add(new URL(railway.startsWith("http") ? railway : `https://${railway}`).hostname);
    } catch {
      // ignore
    }
  }
  return hosts;
}

/** Allow evidence proxy to fetch from Cloudinary or the configured API host */
export function isAllowedEvidenceMediaUrl(url: string): boolean {
  if (!isSafeExternalUrl(url)) return false;
  try {
    const hostname = new URL(url).hostname;
    const allowed = collectAllowedMediaHosts();
    return [...allowed].some((h) => hostname === h || hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}
