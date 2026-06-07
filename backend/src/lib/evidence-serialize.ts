import { resolveEvidenceDeliveryUrl } from "./cloudinary.js";

type EvidenceLike = {
  url: string;
  publicId?: string | null;
  visibility: "PUBLIC" | "PRIVATE";
  mimeType?: string | null;
};

/** Fresh delivery URLs for admin UI (signed Cloudinary, unchanged local stream URLs). */
export function serializeEvidenceForAdmin<T extends EvidenceLike>(row: T): T {
  return {
    ...row,
    url: resolveEvidenceDeliveryUrl(row.url, row.publicId, row.visibility, row.mimeType),
  };
}

/** Public case pages — only PUBLIC evidence; refresh signed URLs when needed. */
export function serializeEvidenceForPublic<T extends EvidenceLike>(row: T): T {
  return {
    ...row,
    url: resolveEvidenceDeliveryUrl(row.url, row.publicId, "PUBLIC", row.mimeType),
  };
}
