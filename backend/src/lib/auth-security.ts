export const LOGIN_SECURITY_CONFIG = {
  ipFailLimit: 3,
  ipWindowMs: 15 * 60_000,
  ipBlockMs: 15 * 60_000,
  accountFailLimit: 5,
  accountLockMs: 30 * 60_000,
  captchaAfterFailures: 2,
  baseDelayMs: 500,
  maxDelayMs: 4000,
} as const;

export function calculateProgressiveDelayMs(failedAttempts: number): number {
  if (failedAttempts <= 0) return 0;
  const raw = LOGIN_SECURITY_CONFIG.baseDelayMs * Math.pow(2, failedAttempts - 1);
  return Math.min(raw, LOGIN_SECURITY_CONFIG.maxDelayMs);
}

export function shouldRequireCaptcha(ipFailures: number, accountFailures: number): boolean {
  return (
    ipFailures >= LOGIN_SECURITY_CONFIG.captchaAfterFailures ||
    accountFailures >= LOGIN_SECURITY_CONFIG.captchaAfterFailures
  );
}

export function isRiskyLoginContext(
  lastLoginIp: string | null | undefined,
  lastLoginUserAgent: string | null | undefined,
  currentIp: string,
  currentUserAgent: string
): boolean {
  const hasHistory = Boolean(lastLoginIp || lastLoginUserAgent);
  if (!hasHistory) return false;
  return Boolean(
    (lastLoginIp && lastLoginIp !== currentIp) ||
    (lastLoginUserAgent && lastLoginUserAgent !== currentUserAgent)
  );
}

export async function sleep(ms: number): Promise<void> {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function getBlockedLoginMessage(reason: "ip_blocked" | "locked"): string {
  return reason === "locked"
    ? "Account temporarily locked"
    : "Too many login attempts from this IP";
}
