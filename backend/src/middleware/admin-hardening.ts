import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { getClientIp, rateLimit } from "../lib/rate-limit.js";
import { logAudit } from "../lib/audit.js";
import { buildActionFingerprint, consumeActionToken } from "../lib/action-token.js";
import { isOriginAllowed, parseFrontendOrigins } from "../lib/origin-utils.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const isProduction = process.env.NODE_ENV === "production";
const enforceTotp = process.env.ENFORCE_ADMIN_TOTP === "true";
const RECYCLE_BIN_RESTORE_PATH = /^\/recycle-bin\/[^/]+\/[^/]+\/restore$/;

const MFA_EXEMPT_PATH = /^\/security\/mfa\//;

function parseAllowedOrigins(): string[] {
  const fallback = process.env.FRONTEND_URL ?? "http://localhost:3000";
  return parseFrontendOrigins(fallback, process.env.FRONTEND_URLS ?? fallback);
}

function getAllowedOrigins(): string[] {
  return parseAllowedOrigins();
}

function refererMatchesAllowed(referer: string, allowedOrigins: string[]): boolean {
  try {
    return isOriginAllowed(new URL(referer).origin, allowedOrigins);
  } catch {
    return allowedOrigins.some((allowed) => referer.startsWith(allowed));
  }
}

function parseAllowedAdminIps(): string[] {
  return (process.env.ADMIN_IP_ALLOWLIST ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function hasBearerAuth(req: Request): boolean {
  const auth = req.headers.authorization;
  return typeof auth === "string" && auth.startsWith("Bearer ");
}

export async function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  if (!UNSAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const hasOrigin = typeof origin === "string" && origin.length > 0;
  const hasReferer = typeof referer === "string" && referer.length > 0;

  // NextAuth credentials sign-in proxies POST /login from Vercel without Origin/Referer.
  const isLoginProxy = req.path === "/login" && req.method.toUpperCase() === "POST";
  if (isProduction && !hasOrigin && !hasReferer && !isLoginProxy) {
    res.status(403).json({ error: "Origin required" });
    return;
  }

  if (!hasOrigin && !hasReferer) {
    next();
    return;
  }

  const allowedOrigins = getAllowedOrigins();
  const trustedOrigin =
    typeof origin === "string" &&
    isOriginAllowed(origin, allowedOrigins);
  const trustedReferer = typeof referer === "string" && refererMatchesAllowed(referer, allowedOrigins);

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
  // Vercel admin-proxy calls Railway with a Bearer JWT — IP allowlist cannot use Vercel egress IPs.
  if (hasBearerAuth(req)) {
    next();
    return;
  }

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
    res.status(403).json({ error: "IP not allowed", code: "ip_not_allowed" });
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

  // Owners can read the admin UI (dashboard, inbox, MFA status) while finishing setup.
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD") {
    next();
    return;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: req.admin.id },
    select: { totpEnabled: true },
  });

  if (!admin?.totpEnabled) {
    res.status(403).json({
      error: "MFA setup required before using admin API",
      code: "mfa_setup_required",
    });
    return;
  }

  next();
}

export async function requireDestructiveActionToken(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  const needsToken =
    method === "DELETE" || (method === "POST" && RECYCLE_BIN_RESTORE_PATH.test(req.path));

  if (!needsToken) {
    next();
    return;
  }

  const admin = req.admin;
  const token = req.headers["x-admin-action-token"];
  const actionToken = typeof token === "string" ? token : "";
  const ip = getClientIp(req);

  const fingerprint = buildActionFingerprint(method, req.path);
  const valid = admin && (await consumeActionToken(actionToken, admin.id, "admin:destructive", fingerprint));
  if (!valid) {
    await logAudit({
      action: "LOGIN_FAILED",
      entityType: "action_token_blocked",
      ipAddress: ip,
      details: JSON.stringify({ path: req.path, method }),
    });
    res.status(403).json({ error: "High-risk action token required" });
    return;
  }

  next();
}

/** @deprecated Use requireDestructiveActionToken */
export const requireDeleteActionToken = requireDestructiveActionToken;

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
