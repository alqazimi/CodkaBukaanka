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

export function isHeicUpload(mimetype: string, originalname: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  return mimetype === "image/heic" || mimetype === "image/heif" || ext === ".heic" || ext === ".heif";
}

export function isAllowedUploadMime(mimetype: string, originalname: string): boolean {
  if (isHeicUpload(mimetype, originalname)) return false;
  return ALLOWED_UPLOAD_MIMES.includes(resolveUploadMime(mimetype, originalname));
}
