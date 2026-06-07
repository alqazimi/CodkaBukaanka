import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";
import jwt from "jsonwebtoken";
import { signToken, requireAuth } from "../middleware/auth.js";
import { ADMIN_SESSION_REFRESH_GRACE_SEC } from "../lib/session-config.js";
import { getClientIp } from "../lib/utils.js";
import { checkLoginAllowed, recordLoginFailure, recordLoginSuccess, clearIpLoginFailures } from "../lib/login-guard.js";
import { verifyCaptchaToken } from "../lib/captcha.js";
import { isRiskyLoginContext, needsRiskCaptchaAfterLogin } from "../lib/auth-security.js";
import { normalizeAdminRole, roleRequiresLoginTotp, roleRequiresMfaSetup } from "../lib/rbac.js";
import { ADMIN_SESSION_MAX_AGE_MS } from "../lib/session-config.js";
import { verifyAdminTotp } from "../lib/totp.js";
import { adminHasTotpConfigured, openTotpSecret } from "../lib/totp-store.js";
import { signActionToken } from "../lib/action-token.js";
import { incrementAdminTokenVersion } from "../lib/token-version.js";
import { rateLimitActionToken } from "../middleware/admin-hardening.js";
import { asyncHandler } from "../lib/async-handler.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(256),
  captchaToken: z.string().max(2000).optional(),
  totpToken: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && /^\d{6}$/.test(v) ? v : undefined)),
});

const isProduction = process.env.NODE_ENV === "production";
const enforceTotp = process.env.ENFORCE_ADMIN_TOTP === "true";

const INVALID_CREDENTIALS = "Invalid credentials";

type LoginFailureCode =
  | "invalid_credentials"
  | "require_captcha"
  | "captcha_not_configured"
  | "account_locked"
  | "ip_blocked"
  | "mfa_invalid";

function sendCaptchaFailure(
  res: import("express").Response,
  captcha: { ok: boolean; reason?: string }
): void {
  if (captcha.reason === "not_configured") {
    sendLoginFailure(res, 503, "captcha_not_configured");
    return;
  }
  sendLoginFailure(res, 401, "require_captcha");
}

function sendLoginFailure(
  res: import("express").Response,
  status: number,
  code: LoginFailureCode,
  extra?: { retryAfterSeconds?: number }
): void {
  if (extra?.retryAfterSeconds) {
    res.setHeader("Retry-After", String(extra.retryAfterSeconds));
  }
  res.status(status).json({
    error: INVALID_CREDENTIALS,
    code,
    ...extra,
  });
}

router.post("/login", async (req, res) => {
  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] ?? "unknown";
  try {
    const { email, password, captchaToken, totpToken } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const guard = await checkLoginAllowed(ip, normalizedEmail);
    if (!guard.allowed) {
      const retrySec = guard.retryAfterMs ? Math.ceil(guard.retryAfterMs / 1000) : 900;
      sendLoginFailure(res, 429, guard.reason === "locked" ? "account_locked" : "ip_blocked", {
        retryAfterSeconds: retrySec,
      });
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: guard.reason === "locked" ? "account_locked" : "ip_blocked",
        ipAddress: ip,
        details: JSON.stringify({ email: normalizedEmail, retryAfterSeconds: retrySec }),
      });
      return;
    }

    let captchaVerifiedForRequest = false;
    if (guard.requireCaptcha) {
      const captcha = await verifyCaptchaToken(captchaToken, ip);
      if (!captcha.ok) {
        await recordLoginFailure(normalizedEmail, ip, undefined, "captcha_failed");
        sendCaptchaFailure(res, captcha);
        return;
      }
      captchaVerifiedForRequest = true;
    }

    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin || !admin.active || !(await bcrypt.compare(password, admin.passwordHash))) {
      await recordLoginFailure(normalizedEmail, ip, admin?.id, "invalid_credentials");
      sendLoginFailure(res, 401, "invalid_credentials");
      return;
    }

    const role = normalizeAdminRole(admin.role);
    if (!role) {
      await recordLoginFailure(normalizedEmail, ip, admin.id, "invalid_role");
      sendLoginFailure(res, 401, "invalid_credentials");
      return;
    }

    const mustVerifyTotp =
      roleRequiresLoginTotp(role) &&
      (adminHasTotpConfigured(admin.totpSecret) || admin.totpEnabled);
    if (mustVerifyTotp) {
      if (!totpToken) {
        await recordLoginFailure(normalizedEmail, ip, admin.id, "mfa_failed");
        sendLoginFailure(res, 401, "mfa_invalid");
        return;
      }
      const secret = openTotpSecret(admin.totpSecret) ?? "";
      if (!secret) {
        await recordLoginFailure(normalizedEmail, ip, admin.id, "mfa_failed");
        sendLoginFailure(res, 401, "mfa_invalid");
        return;
      }
      const validTotp = await verifyAdminTotp(totpToken, secret);
      if (!validTotp) {
        await recordLoginFailure(normalizedEmail, ip, admin.id, "mfa_failed");
        await logAudit({
          adminId: admin.id,
          action: "LOGIN_FAILED",
          entityType: "mfa_failure",
          entityId: admin.id,
          ipAddress: ip,
        });
        sendLoginFailure(res, 401, "mfa_invalid");
        return;
      }
      if (!admin.totpEnabled) {
        await prisma.admin.update({
          where: { id: admin.id },
          data: { totpEnabled: true },
        });
        admin.totpEnabled = true;
      }
    }

    const riskyContext = isRiskyLoginContext(admin.lastLoginIp, admin.lastLoginUserAgent, ip, userAgent);
    if (needsRiskCaptchaAfterLogin(riskyContext, captchaVerifiedForRequest)) {
      const captcha = await verifyCaptchaToken(captchaToken, ip);
      if (!captcha.ok) {
        await recordLoginFailure(normalizedEmail, ip, admin.id, "risk_challenge_failed");
        sendCaptchaFailure(res, captcha);
        return;
      }
    }

    await recordLoginSuccess(admin.id);
    await clearIpLoginFailures(ip);
    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        lastLoginUserAgent: userAgent,
        lastLoginRiskFlagged: riskyContext,
      },
    });

    await logAudit({
      adminId: admin.id,
      action: "LOGIN",
      entityType: "admin",
      entityId: admin.id,
      ipAddress: ip,
      details: JSON.stringify({ riskyContext }),
    });

    const user = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role,
      totpEnabled: admin.totpEnabled,
      requiresMfaSetup: roleRequiresMfaSetup(role, enforceTotp, admin.totpEnabled),
    };
    const accessToken = signToken({ ...user, tokenVersion: admin.tokenVersion });

    res.cookie("admin_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: ADMIN_SESSION_MAX_AGE_MS,
    });

    // Token only in header for server-side NextAuth — not in JSON body (avoids browser exposure).
    res.setHeader("X-Auth-Token", accessToken);
    res.json({ user });
  } catch {
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/refresh", asyncHandler(async (req, res) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized", code: "session_expired" });
    return;
  }

  type RefreshClaims = {
    id?: string;
    tv?: number;
    exp?: number;
  };

  let decoded: RefreshClaims;
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      ignoreExpiration: true,
    }) as RefreshClaims;
  } catch {
    res.status(401).json({ error: "Invalid token", code: "session_expired" });
    return;
  }

  if (!decoded.id) {
    res.status(401).json({ error: "Invalid token", code: "session_expired" });
    return;
  }

  if (decoded.exp) {
    const expiredForSec = Math.floor(Date.now() / 1000) - decoded.exp;
    if (expiredForSec > ADMIN_SESSION_REFRESH_GRACE_SEC) {
      res.status(401).json({ error: "Session expired", code: "session_expired" });
      return;
    }
  }

  const admin = await prisma.admin.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      lockedUntil: true,
      tokenVersion: true,
    },
  });

  if (!admin || !admin.active) {
    res.status(401).json({ error: "Unauthorized", code: "session_expired" });
    return;
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    res.status(401).json({ error: "Unauthorized", code: "session_expired" });
    return;
  }

  if (decoded.tv === undefined || decoded.tv !== admin.tokenVersion) {
    res.status(401).json({ error: "Invalid token", code: "session_expired" });
    return;
  }

  const role = normalizeAdminRole(admin.role);
  if (!role) {
    res.status(403).json({
      error: "This account does not have a valid admin role. Contact the site owner.",
      code: "invalid_admin_role",
    });
    return;
  }

  const accessToken = signToken({ ...admin, role, tokenVersion: admin.tokenVersion });
  res.setHeader("X-Auth-Token", accessToken);
  res.json({ ok: true });
}));

router.post("/logout", requireAuth, asyncHandler(async (req, res) => {
  if (req.admin?.id) {
    await incrementAdminTokenVersion(req.admin.id);
    await logAudit({
      adminId: req.admin.id,
      action: "LOGOUT",
      entityType: "admin",
      entityId: req.admin.id,
    });
  }
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
  });
  res.json({ ok: true });
}));

router.get("/action-token", requireAuth, rateLimitActionToken, asyncHandler(async (req, res) => {
  const admin = req.admin;
  if (!admin) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    token: signActionToken(admin.id, "admin:destructive"),
    expiresIn: 60,
  });
}));

export default router;
