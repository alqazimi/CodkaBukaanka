export const MAX_SUBMISSION_EVIDENCE_FILES = 20;
export const MAX_EVIDENCE_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EVIDENCE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.pdf,.doc,.docx";

export function formatEvidenceBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateEvidenceFile(file: File): string | null {
  if (file.size > MAX_EVIDENCE_FILE_BYTES) {
    return `“${file.name}” is too large (max ${MAX_EVIDENCE_FILE_BYTES / 1024 / 1024}MB per file).`;
  }
  const allowed = ALLOWED_EVIDENCE_ACCEPT.split(",").map((part) => part.trim().toLowerCase());
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
  const ok =
    (type && allowed.includes(type)) ||
    (ext && allowed.includes(ext)) ||
    /\.(jpe?g|png|webp|gif|mp4|webm|pdf|docx?)$/.test(name);
  if (!ok) {
    return `“${file.name}” is not an allowed file type.`;
  }
  return null;
}
