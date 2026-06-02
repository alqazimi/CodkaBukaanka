import { consumeRateLimit } from "./rate-limit-store.js";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function getClientIp(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.ip ?? "unknown";
}

export async function rateLimit(
  identifier: string,
  limit = MAX_REQUESTS,
  windowMs = WINDOW_MS
): Promise<{ success: boolean }> {
  const result = await consumeRateLimit(identifier, limit, windowMs);
  return { success: result.success };
}
