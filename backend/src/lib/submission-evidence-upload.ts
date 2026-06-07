import type { EvidenceType } from "@prisma/client";
import {
  canFallbackToLocalUploads,
  canUseLocalStorage,
  getUploadPublicBaseUrl,
  saveLocalUpload,
  shouldPreferLocalUploads,
} from "./local-upload.js";
import { isCloudinaryConfigured, uploadToCloudinary } from "./cloudinary.js";
import { validateUploadFile } from "./file-validation.js";
import { resolveUploadMime } from "./upload-mime.js";

export const MAX_SUBMISSION_EVIDENCE_FILES = 20;
export const SUBMISSION_EVIDENCE_FOLDER = "diiwaanka-bukaanka/submissions/pending";

function evidenceTypeFromMime(mimeType: string): EvidenceType {
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "DOCUMENT";
}

export type UploadedSubmissionEvidence = {
  type: EvidenceType;
  url: string;
  publicId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

export async function uploadSubmissionEvidenceFile(
  file: Express.Multer.File
): Promise<{ ok: true; data: UploadedSubmissionEvidence } | { ok: false; error: string }> {
  const mimeType = resolveUploadMime(file.mimetype, file.originalname);
  const validation = validateUploadFile(file.buffer, mimeType, file.size);
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const useLocal = shouldPreferLocalUploads();
  const hasCloudinary = isCloudinaryConfigured();
  const allowProdLocal = process.env.NODE_ENV === "production" && process.env.USE_LOCAL_UPLOADS === "true";

  if (process.env.NODE_ENV === "production" && !allowProdLocal && !hasCloudinary) {
    return {
      ok: false,
      error: "File uploads are temporarily unavailable. Describe your evidence in the notes field and try again later.",
    };
  }

  if (!hasCloudinary && !canUseLocalStorage()) {
    return {
      ok: false,
      error: "File uploads are temporarily unavailable. Describe your evidence in the notes field and try again later.",
    };
  }

  const resourceType = mimeType.startsWith("video/")
    ? "video"
    : mimeType.startsWith("image/")
      ? "image"
      : "raw";

  let result: { url: string; publicId: string; bytes: number };

  if (useLocal || !hasCloudinary) {
    result = await saveLocalUpload(file.buffer, mimeType, file.originalname);
  } else {
    try {
      result = await uploadToCloudinary(file.buffer, {
        folder: SUBMISSION_EVIDENCE_FOLDER,
        resource_type: resourceType,
        accessType: "authenticated",
      });
    } catch (error) {
      if (!canFallbackToLocalUploads()) {
        console.error("[submission-evidence] Cloudinary failed:", error);
        return { ok: false, error: "Could not upload file. Try again or submit without that file." };
      }
      console.warn(
        "[submission-evidence] Cloudinary failed, using local storage:",
        error instanceof Error ? error.message : error
      );
      result = await saveLocalUpload(file.buffer, mimeType, file.originalname);
    }
  }

  if (result.publicId.startsWith("local/")) {
    const filename = result.publicId.slice("local/".length);
    const base = getUploadPublicBaseUrl();
    result.url = `${base}/api/admin/evidence/stream/${encodeURIComponent(filename)}`;
  }

  return {
    ok: true,
    data: {
      type: evidenceTypeFromMime(mimeType),
      url: result.url,
      publicId: result.publicId,
      fileName: file.originalname,
      mimeType,
      fileSize: result.bytes,
    },
  };
}
