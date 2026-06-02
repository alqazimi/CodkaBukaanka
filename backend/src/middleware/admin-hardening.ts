import type { Request, Response, NextFunction } from "express";
import { getClientIp } from "../lib/rate-limit.js";
import { logAudit } from "../lib/audit.js";
import { verifyActionToken } from "../lib/action-token.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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

  // Allow non-browser/server-to-server calls that do not carry Origin/Referer headers.
  // Browser requests should include at least one of these, and those remain enforced below.
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
    res.status(403).json({ error: "Blocked by origin policy" });
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
