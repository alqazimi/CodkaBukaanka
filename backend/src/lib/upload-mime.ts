import path from "node:path";
import { ALLOWED_UPLOAD_MIMES } from "./constants.js";

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Browsers sometimes send application/octet-stream — infer from filename when safe. */
export function resolveUploadMime(mimetype: string, originalname: string): string {
  if (ALLOWED_UPLOAD_MIMES.includes(mimetype)) return mimetype;
  const ext = path.extname(originalname).toLowerCase();
  const inferred = EXT_TO_MIME[ext];
  if (inferred) return inferred;
  return mimetype;
}

export function isAllowedUploadMime(mimetype: string, originalname: string): boolean {
  return ALLOWED_UPLOAD_MIMES.includes(resolveUploadMime(mimetype, originalname));
}
