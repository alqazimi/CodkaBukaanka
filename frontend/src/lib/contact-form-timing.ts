const STORAGE_PREFIX = "codkabukaanka_form_started_at";

export function contactFormStorageKey(type: "contact" | "correction"): string {
  return `${STORAGE_PREFIX}:${type}`;
}

export function readContactFormStartedAt(type: "contact" | "correction"): string {
  if (typeof window === "undefined") return Date.now().toString();
  const key = contactFormStorageKey(type);
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const now = Date.now().toString();
  sessionStorage.setItem(key, now);
  return now;
}

export function clearContactFormStartedAt(type: "contact" | "correction"): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(contactFormStorageKey(type));
}

/** Match backend anti-bot minimum delay (ms). */
export const CONTACT_FORM_MIN_DELAY_MS = 800;

export function msUntilContactFormSubmit(startedAt: string): number {
  const start = Number(startedAt);
  if (!Number.isFinite(start) || start <= 0) return CONTACT_FORM_MIN_DELAY_MS;
  return Math.max(0, CONTACT_FORM_MIN_DELAY_MS - (Date.now() - start));
}
