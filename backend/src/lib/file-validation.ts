import { ALLOWED_UPLOAD_MIMES, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "./constants.js";

type MagicRule = { mime: string; bytes: number[]; offset?: number };

const MAGIC_RULES: MagicRule[] = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: "video/mp4", bytes: [0x00, 0x00, 0x00], offset: 0 }, // ftyp at offset 4
];

function matchesMagic(buffer: Buffer, rule: MagicRule): boolean {
  const offset = rule.offset ?? 0;
  if (buffer.length < offset + rule.bytes.length) return false;
  for (let i = 0; i < rule.bytes.length; i++) {
    if (buffer[offset + i] !== rule.bytes[i]) return false;
  }
  return true;
}

function isMp4(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  return buffer.slice(4, 8).toString("ascii") === "ftyp";
}

function isWebm(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;
}

function isDocx(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

export function validateUploadFile(
  buffer: Buffer,
  mimeType: string,
  size: number
): { valid: true } | { valid: false; error: string } {
  if (size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: `File exceeds ${MAX_UPLOAD_MB}MB limit` };
  }

  if (!ALLOWED_UPLOAD_MIMES.includes(mimeType)) {
    return { valid: false, error: "File type not allowed" };
  }

  if (mimeType === "video/webm" && isWebm(buffer)) return { valid: true };
  if (mimeType === "video/mp4" && isMp4(buffer)) return { valid: true };
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" &&
    isDocx(buffer)
  ) {
    return { valid: true };
  }
  if (mimeType === "application/msword") {
    // Legacy .doc — OLE compound document
    if (buffer.length >= 8 && buffer[0] === 0xd0 && buffer[1] === 0xcf) return { valid: true };
    return { valid: false, error: "Invalid document file signature" };
  }

  const rule = MAGIC_RULES.find((r) => r.mime === mimeType);
  if (rule && matchesMagic(buffer, rule)) return { valid: true };

  // GIF/WebP/JPEG/PNG/PDF covered by rules
  if (!rule) {
    return { valid: false, error: "Unsupported MIME type for magic-byte validation" };
  }

  return { valid: false, error: "File content does not match declared type" };
}
