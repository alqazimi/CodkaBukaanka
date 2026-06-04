function hostsFromEnvUrls(): string[] {
  const candidates = [
    process.env.API_PUBLIC_URL,
    process.env.API_URL,
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN.replace(/^https?:\/\//, "")}`
      : undefined,
  ].filter((v): v is string => Boolean(v?.trim()));

  const hosts: string[] = [];
  for (const raw of candidates) {
    try {
      const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
      hosts.push(new URL(normalized).hostname);
    } catch {
      // ignore invalid URLs
    }
  }
  return hosts;
}

function buildAllowedEvidenceHosts(): string[] {
  const fromEnv = (process.env.ALLOWED_EVIDENCE_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  const devHosts = process.env.NODE_ENV !== "production" ? ["localhost", "127.0.0.1"] : [];

  return Array.from(
    new Set(["res.cloudinary.com", ...hostsFromEnvUrls(), ...fromEnv, ...devHosts])
  );
}

const ALLOWED_EVIDENCE_HOSTS = buildAllowedEvidenceHosts();

export function isSafeEvidenceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") return false;
    const hosts = buildAllowedEvidenceHosts();
    return hosts.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export function assertSafeEvidenceUrl(url: string): void {
  if (!isSafeEvidenceUrl(url)) {
    const hint =
      process.env.NODE_ENV === "production"
        ? "Evidence URL must be HTTPS from Cloudinary or your API host (set API_PUBLIC_URL on Railway)."
        : "Evidence URL must be from an allowed host (e.g. Cloudinary or localhost API).";
    throw new Error(hint);
  }
}

export { ALLOWED_EVIDENCE_HOSTS };
