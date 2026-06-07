import type { CaseSubmissionEvidence } from "@prisma/client";
import { resolveEvidenceDeliveryUrl } from "./cloudinary.js";

export function serializeSubmissionEvidenceForAdmin(evidence: CaseSubmissionEvidence) {
  return {
    id: evidence.id,
    type: evidence.type,
    fileName: evidence.fileName,
    mimeType: evidence.mimeType,
    fileSize: evidence.fileSize,
    url: resolveEvidenceDeliveryUrl(evidence.url, evidence.publicId, "PRIVATE", evidence.mimeType),
    createdAt: evidence.createdAt.toISOString(),
  };
}
