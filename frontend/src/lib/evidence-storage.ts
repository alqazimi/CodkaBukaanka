import type { EvidenceItem } from "@/types/entities";

/** Files stored on Railway/local disk — lost on redeploy; re-upload to Cloudinary. */
export function isEphemeralLocalEvidence(item: Pick<EvidenceItem, "url"> & { publicId?: string | null }): boolean {
  if (item.publicId?.startsWith("local/")) return true;
  return (
    item.url.includes("/api/evidence/stream/") ||
    item.url.includes("/api/admin/evidence/stream/")
  );
}

export function countEphemeralLocalEvidence(items: Array<Pick<EvidenceItem, "url"> & { publicId?: string | null }>): number {
  return items.filter(isEphemeralLocalEvidence).length;
}
