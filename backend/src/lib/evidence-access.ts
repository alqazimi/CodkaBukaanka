import { existsSync } from "node:fs";
import path from "node:path";
import type { Response } from "express";
import { prisma } from "./prisma.js";
import { PUBLIC_CASE_FILTER, NOT_DELETED } from "./constants.js";
import { resolveLocalUploadPath } from "./local-upload.js";

const UPLOAD_CONTENT_TYPES: Record<string, string> = {
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

export function localStorageKeyFromPublicId(publicId: string | null | undefined): string | null {
  if (!publicId?.startsWith("local/")) return null;
  const key = publicId.slice("local/".length);
  if (!key || !/^[\w.-]+$/.test(key)) return null;
  return key;
}

export function buildLocalEvidenceStreamUrl(baseUrl: string, storageKey: string): string {
  const base = baseUrl.replace(/\/$/, "");
  return `${base}/api/evidence/stream/${encodeURIComponent(storageKey)}`;
}

export async function findEvidenceForPublicStream(storageKey: string) {
  return prisma.evidence.findFirst({
    where: {
      publicId: `local/${storageKey}`,
      visibility: "PUBLIC",
      ...NOT_DELETED,
      case: PUBLIC_CASE_FILTER,
    },
    select: { id: true, publicId: true, mimeType: true, fileName: true },
  });
}

export async function findEvidenceForAdminStream(storageKey: string) {
  return prisma.evidence.findFirst({
    where: {
      publicId: `local/${storageKey}`,
      ...NOT_DELETED,
    },
    select: { id: true, publicId: true, mimeType: true, fileName: true, visibility: true },
  });
}

export function sendLocalEvidenceFile(res: Response, storageKey: string, mimeType?: string | null): boolean {
  const filePath = resolveLocalUploadPath(storageKey);
  if (!filePath || !existsSync(filePath)) return false;

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeType ?? UPLOAD_CONTENT_TYPES[ext] ?? "application/octet-stream";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(filePath);
  return true;
}
