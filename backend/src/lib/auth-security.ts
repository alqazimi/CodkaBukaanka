export const LOGIN_SECURITY_CONFIG = {
  /** Failed attempts from one IP before a short cooldown. */
  ipFailLimit: 10,
  ipWindowMs: 60_000,
  ipBlockMs: 15 * 60_000,
  /** Failed attempts on one account before a short cooldown. */
  accountFailLimit: 8,
  accountLockMs: 15 * 60_000,
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

/** When Turnstile is configured, every login attempt must pass the check (not only after failures). */
export function shouldRequireLoginCaptcha(
  ipFailures: number,
  accountFailures: number,
  captchaConfigured: boolean
): boolean {
  if (captchaConfigured) return true;
  return shouldRequireCaptcha(ipFailures, accountFailures);
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

/** Turnstile tokens are single-use — never verify the same token twice in one login. */
export function needsRiskCaptchaAfterLogin(
  riskyContext: boolean,
  captchaVerifiedForRequest: boolean,
  totpVerifiedForRequest = false
): boolean {
  if (totpVerifiedForRequest) return false;
  return riskyContext && !captchaVerifiedForRequest;
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
