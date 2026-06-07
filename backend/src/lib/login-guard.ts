import { prisma } from "./prisma.js";
import { getRateKey, incrementRateKey, resetRateKey } from "./rate-limit-store.js";
import { logAudit } from "./audit.js";
import {
  LOGIN_SECURITY_CONFIG,
  calculateProgressiveDelayMs,
  shouldRequireCaptcha,
  sleep,
} from "./auth-security.js";

export type LoginGuardResult =
  | { allowed: true; requireCaptcha: boolean; ipFailures: number; accountFailures: number }
  | {
    allowed: false;
    reason: "ip_blocked" | "locked";
    retryAfterMs: number;
    requireCaptcha: boolean;
    ipFailures: number;
    accountFailures: number;
  };

export async function checkLoginAllowed(ip: string, email: string): Promise<LoginGuardResult> {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase();
  const ipFailures = (await getRateKey(`login:fail-ip:${ip}`)).count;
  const blocked = await getRateKey(`login:blocked-ip:${ip}`);
  const ipBlocked =
    (blocked.count > 0 && blocked.resetAt > now) ||
    ipFailures >= LOGIN_SECURITY_CONFIG.ipFailLimit;

  if (ipBlocked) {
    if (blocked.count === 0 || blocked.resetAt <= now) {
      await incrementRateKey(`login:blocked-ip:${ip}`, LOGIN_SECURITY_CONFIG.ipBlockMs);
    }
    const activeBlock = await getRateKey(`login:blocked-ip:${ip}`);
    const retryAfterMs = Math.max(activeBlock.resetAt - now, 1);
    const adminForBlock = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
      select: { failedLoginAttempts: true },
    });
    const accountFailures = adminForBlock?.failedLoginAttempts ?? 0;
    return {
      allowed: false,
      reason: "ip_blocked",
      retryAfterMs,
      requireCaptcha: shouldRequireCaptcha(ipFailures, accountFailures),
      ipFailures,
      accountFailures,
    };
  }

  const admin = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, lockedUntil: true, failedLoginAttempts: true },
  });
  const accountFailures = admin?.failedLoginAttempts ?? 0;
  const requireCaptcha = shouldRequireCaptcha(ipFailures, accountFailures);

  if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
    return {
      allowed: false,
      reason: "locked",
      retryAfterMs: Math.max(admin.lockedUntil.getTime() - now, 1),
      requireCaptcha,
      ipFailures,
      accountFailures,
    };
  }

  return { allowed: true, requireCaptcha, ipFailures, accountFailures };
}

export async function recordLoginFailure(
  email: string,
  ip: string,
  adminId?: string,
  reason: "invalid_credentials" | "captcha_failed" | "mfa_failed" | "risk_challenge_failed" | "invalid_role" = "invalid_credentials"
): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const ipKey = `login:fail-ip:${ip}`;
  const ipTrack = await incrementRateKey(ipKey, LOGIN_SECURITY_CONFIG.ipWindowMs);
  if (ipTrack.count >= LOGIN_SECURITY_CONFIG.ipFailLimit) {
    await incrementRateKey(`login:blocked-ip:${ip}`, LOGIN_SECURITY_CONFIG.ipBlockMs);
    await logAudit({
      action: "LOGIN_FAILED",
      entityType: "ip_blocked",
      details: JSON.stringify({ ip, count: ipTrack.count }),
      ipAddress: ip,
    });
  }

  let accountAttempts = 0;
  let lockedUntil: Date | null = null;
  if (adminId) {
    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    if (updated) {
      accountAttempts = updated.failedLoginAttempts;
      if (accountAttempts >= LOGIN_SECURITY_CONFIG.accountFailLimit) {
        lockedUntil = new Date(Date.now() + LOGIN_SECURITY_CONFIG.accountLockMs);
        await prisma.admin.update({
          where: { id: adminId },
          data: { lockedUntil },
        });
      }
      if (lockedUntil) {
        await logAudit({
          adminId,
          action: "LOGIN_FAILED",
          entityType: "account_locked",
          entityId: adminId,
          ipAddress: ip,
          details: JSON.stringify({ lockedUntil: lockedUntil.toISOString(), attempts: accountAttempts }),
        });
      }
    }
  }

  const delayMs = calculateProgressiveDelayMs(Math.max(ipTrack.count, accountAttempts));
  await sleep(delayMs);

  await logAudit({
    adminId: adminId ?? undefined,
    action: "LOGIN_FAILED",
    entityType: "admin",
    entityId: adminId,
    ipAddress: ip,
    details: JSON.stringify({
      email: normalizedEmail,
      reason,
      ipFailures: ipTrack.count,
      accountFailures: accountAttempts,
      delayMs,
    }),
  });
}

export async function recordLoginSuccess(adminId: string): Promise<void> {
  await prisma.admin.update({
    where: { id: adminId },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

export async function clearIpLoginFailures(ip: string): Promise<void> {
  await resetRateKey(`login:fail-ip:${ip}`);
  await resetRateKey(`login:blocked-ip:${ip}`);
}
