import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { getClientIp, rateLimit } from "../lib/rate-limit.js";
import { logAudit } from "../lib/audit.js";
import { verifyActionToken } from "../lib/action-token.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const isProduction = process.env.NODE_ENV === "production";
const enforceTotp = isProduction || process.env.ENFORCE_ADMIN_TOTP === "true";

const MFA_EXEMPT_PATH = /^\/security\/mfa\//;

function parseAllowedOrigins(): string[] {
  const fallback = process.env.FRONTEND_URL ?? "http://localhost:3000";
  return (process.env.FRONTEND_URLS ?? fallback)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseAllowedAdminIps(): string[] {
  return (process.env.ADMIN_IP_ALLOWLIST ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  if (!UNSAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const hasOrigin = typeof origin === "string" && origin.length > 0;
  const hasReferer = typeof referer === "string" && referer.length > 0;

  if (isProduction && !hasOrigin && !hasReferer) {
    res.status(403).json({ error: "Origin required" });
    return;
  }

  if (!hasOrigin && !hasReferer) {
    next();
    return;
  }

  const allowedOrigins = parseAllowedOrigins();
  const trustedOrigin = typeof origin === "string" && allowedOrigins.includes(origin);
  const trustedReferer =
    typeof referer === "string" && allowedOrigins.some((allowed) => referer.startsWith(allowed));

  if (!trustedOrigin && !trustedReferer) {
    await logAudit({
      action: "LOGIN_FAILED",
      entityType: "origin_blocked",
      ipAddress: getClientIp(req),
      details: JSON.stringify({ method: req.method, path: req.path, origin, referer }),
    });
    res.status(403).json({
      error:
        "Blocked by origin policy. Add your exact site URL (https://…) to FRONTEND_URL and FRONTEND_URLS on the Railway backend.",
    });
    return;
  }

  next();
}

export async function requireAdminIpAllowlist(req: Request, res: Response, next: NextFunction) {
  const allowlist = parseAllowedAdminIps();
  if (allowlist.length === 0) {
    next();
    return;
  }

  const ip = getClientIp(req);
  const isAllowed =
    allowlist.includes(ip) ||
    (ip === "::1" && allowlist.includes("127.0.0.1")) ||
    (ip === "127.0.0.1" && allowlist.includes("::1"));

  if (!isAllowed) {
    await logAudit({
      action: "LOGIN_FAILED",
      entityType: "ip_allowlist_blocked",
      ipAddress: ip,
      details: JSON.stringify({ path: req.path }),
    });
    res.status(403).json({ error: "IP not allowed" });
    return;
  }

  next();
}

export async function requireMfaWhenEnforced(req: Request, res: Response, next: NextFunction) {
  if (!enforceTotp || !req.admin) {
    next();
    return;
  }

  if (MFA_EXEMPT_PATH.test(req.path)) {
    next();
    return;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.id },
    select: { totpEnabled: true },
  });

  if (!admin?.totpEnabled) {
    res.status(403).json({ error: "MFA setup required before using admin API" });
    return;
  }

  next();
}

export async function requireDeleteActionToken(req: Request, res: Response, next: NextFunction) {
  if (req.method.toUpperCase() !== "DELETE") {
    next();
    return;
  }

  const admin = req.admin;
  const token = req.headers["x-admin-action-token"];
  const actionToken = typeof token === "string" ? token : "";
  const ip = getClientIp(req);

  if (!admin || !verifyActionToken(actionToken, admin.id, "admin:delete")) {
    await logAudit({
      action: "LOGIN_FAILED",
      entityType: "action_token_blocked",
      ipAddress: ip,
      details: JSON.stringify({ path: req.path }),
    });
    res.status(403).json({ error: "High-risk action token required" });
    return;
  }

  next();
}

export async function rateLimitActionToken(req: Request, res: Response, next: NextFunction) {
  if (!req.admin) {
    next();
    return;
  }
  const limit = await rateLimit(`action-token:${req.admin.id}`, 30, 60_000);
  if (!limit.success) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
}
