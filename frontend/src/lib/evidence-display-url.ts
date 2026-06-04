/** Fixed preview heights (Tailwind-aligned) — full size only in lightbox */
export const EVIDENCE_FRAME = {
  adminThumb: "h-40 md:h-44",
  reportFeatured: "h-52 sm:h-60 md:h-64",
  reportCard: "h-44 sm:h-48",
  gridCard: "h-44 sm:h-48",
} as const;

type EvidenceImageSize = "thumb" | "preview" | "full";

const CLOUDINARY_TRANSFORMS: Record<EvidenceImageSize, string> = {
  thumb: "c_limit,h_360,w_520,q_auto:good,f_auto",
  preview: "c_limit,h_640,w_960,q_auto:good,f_auto",
  full: "c_limit,h_1600,w_2400,q_auto:good,f_auto",
};

/** Smaller Cloudinary delivery URL for list/card previews; original for lightbox */
export function evidenceImageUrl(url: string, size: EvidenceImageSize = "preview"): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx < 0) return url;
  const prefix = url.slice(0, idx + marker.length);
  const rest = url.slice(idx + marker.length);
  if (!rest.startsWith("v")) {
    return url;
  }
  const transform = CLOUDINARY_TRANSFORMS[size];
  return `${prefix}${transform}/${rest}`;
}
