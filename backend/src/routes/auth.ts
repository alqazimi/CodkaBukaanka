import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { getClientIp } from "../lib/utils.js";
import { checkLoginAllowed, recordLoginFailure, recordLoginSuccess, clearIpLoginFailures } from "../lib/login-guard.js";
import { verifyCaptchaToken } from "../lib/captcha.js";
import { isRiskyLoginContext } from "../lib/auth-security.js";
import { ADMIN_SESSION_MAX_AGE_MS } from "../lib/session-config.js";
import { verifyAdminTotp } from "../lib/totp.js";
import { signActionToken } from "../lib/action-token.js";
import { incrementAdminTokenVersion } from "../lib/token-version.js";
import { rateLimitActionToken } from "../middleware/admin-hardening.js";
import { asyncHandler } from "../lib/async-handler.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(256),
  captchaToken: z.string().max(2000).optional(),
  totpToken: z.string().regex(/^\d{6}$/).optional(),
});

const isProduction = process.env.NODE_ENV === "production";
const enforceTotp = isProduction || process.env.ENFORCE_ADMIN_TOTP === "true";

const INVALID_CREDENTIALS = "Invalid credentials";

type LoginFailureCode =
  | "invalid_credentials"
  | "require_captcha"
  | "account_locked"
  | "ip_blocked"
  | "mfa_invalid";

function sendLoginFailure(
  res: import("express").Response,
  status: number,
  code: LoginFailureCode,
  extra?: { retryAfterSeconds?: number }
): void {
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
      sendLoginFailure(res, 401, guard.reason === "locked" ? "account_locked" : "ip_blocked", {
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

    if (guard.requireCaptcha) {
      const captcha = await verifyCaptchaToken(captchaToken, ip);
      if (!captcha.ok) {
        await recordLoginFailure(normalizedEmail, ip, undefined, "captcha_failed");
        sendLoginFailure(res, 401, "require_captcha");
        return;
      }
    }

    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin || !admin.active || !(await bcrypt.compare(password, admin.passwordHash))) {
      await recordLoginFailure(normalizedEmail, ip, admin?.id, "invalid_credentials");
      sendLoginFailure(res, 401, "invalid_credentials");
      return;
    }

    if (admin.totpSecret && totpToken) {
      const validTotp = await verifyAdminTotp(totpToken, admin.totpSecret);
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
    } else if (enforceTotp && admin.totpSecret && !admin.totpEnabled) {
      await recordLoginFailure(normalizedEmail, ip, admin.id, "mfa_failed");
      sendLoginFailure(res, 401, "mfa_invalid");
      return;
    } else if (admin.totpEnabled) {
      if (!totpToken) {
        await recordLoginFailure(normalizedEmail, ip, admin.id, "mfa_failed");
        sendLoginFailure(res, 401, "mfa_invalid");
        return;
      }
      const secret = admin.totpSecret ?? "";
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
    }

    const riskyContext = isRiskyLoginContext(admin.lastLoginIp, admin.lastLoginUserAgent, ip, userAgent);
    if (riskyContext) {
      const captcha = await verifyCaptchaToken(captchaToken, ip);
      if (!captcha.ok) {
        await recordLoginFailure(normalizedEmail, ip, admin.id, "risk_challenge_failed");
        sendLoginFailure(res, 401, "require_captcha");
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
      role: admin.role,
      totpEnabled: admin.totpEnabled,
      requiresMfaSetup: enforceTotp && !admin.totpEnabled,
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
    token: signActionToken(admin.id, "admin:delete"),
    expiresIn: 60,
  });
}));

export default router;
