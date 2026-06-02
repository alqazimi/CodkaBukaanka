import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";
import { signToken } from "../middleware/auth.js";
import { getClientIp } from "../lib/utils.js";
import { checkLoginAllowed, recordLoginFailure, recordLoginSuccess, clearIpLoginFailures } from "../lib/login-guard.js";
import { verifyCaptchaToken } from "../lib/captcha.js";
import { getBlockedLoginMessage, isRiskyLoginContext } from "../lib/auth-security.js";
import { ADMIN_SESSION_MAX_AGE_MS } from "../lib/session-config.js";
import { verifyAdminTotp } from "../lib/totp.js";
import { requireAuth } from "../middleware/auth.js";
import { signActionToken } from "../lib/action-token.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(256),
  captchaToken: z.string().max(2000).optional(),
  totpToken: z.string().regex(/^\d{6}$/).optional(),
});

const isProduction = process.env.NODE_ENV === "production";
// In production we always enforce MFA. In development, allow password-only login
// unless the account already has MFA enabled, so admins can bootstrap MFA setup.
const enforceTotp = isProduction || process.env.ENFORCE_ADMIN_TOTP === "true";

router.post("/login", async (req, res) => {
  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] ?? "unknown";
  try {
    const { email, password, captchaToken, totpToken } = loginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase();

    const guard = await checkLoginAllowed(ip, normalizedEmail);
    if (!guard.allowed) {
      const retrySec = guard.retryAfterMs ? Math.ceil(guard.retryAfterMs / 1000) : 900;
      res.status(429).json({
        error: getBlockedLoginMessage(guard.reason),
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
        res.status(400).json({ error: "Captcha required or invalid" });
        return;
      }
    }

    const admin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      await recordLoginFailure(normalizedEmail, ip, admin?.id, "invalid_credentials");
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const requiresMfaSetup = enforceTotp && !admin.totpEnabled;

    if (admin.totpEnabled) {
      const secret = admin.totpSecret ?? "";
      const validTotp = totpToken ? await verifyAdminTotp(totpToken, secret) : false;
      if (!validTotp) {
        await recordLoginFailure(normalizedEmail, ip, admin.id, "mfa_failed");
        await logAudit({
          adminId: admin.id,
          action: "LOGIN_FAILED",
          entityType: "mfa_failure",
          entityId: admin.id,
          ipAddress: ip,
        });
        res.status(401).json({ error: "Invalid MFA token" });
        return;
      }
    }

    const riskyContext = isRiskyLoginContext(admin.lastLoginIp, admin.lastLoginUserAgent, ip, userAgent);
    if (riskyContext) {
      // Risky login from new IP/device requires captcha challenge.
      const captcha = await verifyCaptchaToken(captchaToken, ip);
      if (!captcha.ok) {
        await recordLoginFailure(normalizedEmail, ip, admin.id, "risk_challenge_failed");
        res.status(403).json({ error: "Additional verification required for new device/IP" });
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
      requiresMfaSetup,
    };
    const accessToken = signToken(user);

    res.cookie("admin_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: ADMIN_SESSION_MAX_AGE_MS,
    });

    res.json({ user, accessToken });
  } catch {
    res.status(400).json({ error: "Invalid request" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
  });
  res.json({ ok: true });
});

router.get("/action-token", requireAuth, async (req, res) => {
  const admin = req.admin;
  if (!admin) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    token: signActionToken(admin.id, "admin:delete"),
    expiresIn: 60,
  });
});

export default router;
