const ALLOWED_EVIDENCE_HOSTS = [
  "res.cloudinary.com",
  ...(process.env.NODE_ENV !== "production" ? ["localhost", "127.0.0.1"] : []),
  ...(process.env.ALLOWED_EVIDENCE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
];

export function isSafeEvidenceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") return false;
    return ALLOWED_EVIDENCE_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export function assertSafeEvidenceUrl(url: string): void {
  if (!isSafeEvidenceUrl(url)) {
    throw new Error("Evidence URL must be a secure URL from an allowed host (e.g. Cloudinary)");
  }
}
