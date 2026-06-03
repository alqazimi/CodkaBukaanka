import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const uploadRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "uploads"
);

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export function shouldPreferLocalUploads(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.USE_LOCAL_UPLOADS === "true") return true;
  if (process.env.USE_LOCAL_UPLOADS === "false") return false;
  return false;
}

export function canFallbackToLocalUploads(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function getUploadPublicBaseUrl(): string {
  const configured = process.env.API_PUBLIC_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const port = Number(process.env.PORT) || 4000;
  return `http://localhost:${port}`;
}

export function resolveLocalUploadPath(filename: string): string | null {
  const safeName = path.basename(filename);
  if (!safeName || safeName !== filename || !/^[\w.-]+$/.test(safeName)) return null;
  const resolved = path.resolve(uploadRoot, safeName);
  if (!resolved.startsWith(`${uploadRoot}${path.sep}`) && resolved !== uploadRoot) return null;
  return resolved;
}

export async function saveLocalUpload(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<{ url: string; publicId: string; bytes: number }> {
  await mkdir(uploadRoot, { recursive: true });

  const extFromName = path.extname(originalName).toLowerCase();
  const ext = extFromName && extFromName.length <= 8 ? extFromName : (MIME_EXT[mimeType] ?? "");
  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(uploadRoot, filename);

  await writeFile(filePath, buffer);

  const base = getUploadPublicBaseUrl();
  return {
    url: `${base}/api/uploads/${filename}`,
    publicId: `local/${filename}`,
    bytes: buffer.length,
  };
}
