import { logAudit } from "./audit.js";

const MIN_ELAPSED_MS = 800;
const MAX_ELAPSED_MS = 24 * 60 * 60 * 1000;

export function rejectPublicFormBot(
  fields: { website?: string; startedAt?: string },
  endpoint: string,
  ip: string
): string | null {
  if (fields.website?.trim()) {
    void logAudit({
      action: "LOGIN_FAILED",
      entityType: "bot_blocked",
      ipAddress: ip,
      details: JSON.stringify({ endpoint, reason: "honeypot" }),
    });
    return "Please wait a moment before submitting.";
  }

  const startedAt = Number(fields.startedAt ?? "0");
  const hasStartedAt = Number.isFinite(startedAt) && startedAt > 0;
  const elapsedMs = hasStartedAt ? Date.now() - startedAt : null;

  if (process.env.NODE_ENV === "production" && !hasStartedAt) {
    void logAudit({
      action: "LOGIN_FAILED",
      entityType: "bot_blocked",
      ipAddress: ip,
      details: JSON.stringify({ endpoint, reason: "missing_started_at" }),
    });
    return "Please wait a moment before submitting.";
  }

  if (hasStartedAt && (elapsedMs! < MIN_ELAPSED_MS || elapsedMs! > MAX_ELAPSED_MS)) {
    void logAudit({
      action: "LOGIN_FAILED",
      entityType: "bot_blocked",
      ipAddress: ip,
      details: JSON.stringify({ endpoint, elapsedMs }),
    });
    return "Please wait a moment before submitting.";
  }

  return null;
}
