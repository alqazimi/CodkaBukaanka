import type { Request, Response, NextFunction } from "express";
import { getClientIp, rateLimit } from "../lib/rate-limit.js";
import { getRateKey, incrementRateKey } from "../lib/rate-limit-store.js";
import { logAudit } from "../lib/audit.js";

const BLOCKED_METHODS = new Set(["TRACE", "TRACK", "CONNECT"]);

const BLOCKED_PATH_PATTERNS = [
  /^\/wp-admin/i,
  /^\/wp-login\.php/i,
  /^\/xmlrpc\.php/i,
  /^\/phpmyadmin/i,
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/vendor\/phpunit/i,
  /^\/boaform/i,
  /^\/cgi-bin/i,
];

const SCANNER_UA_PATTERN =
  /(nmap|masscan|zmap|sqlmap|nikto|dirbuster|gobuster|wpscan|acunetix|nessus|openvas|zgrab|whatweb)/i;

const MALICIOUS_QUERY_PATTERN =
  /(\.\.\/|%2e%2e%2f|union\s+select|sleep\(|benchmark\(|information_schema|<script|%3cscript)/i;

const SHIELD_STRIKE_WINDOW_MS = 15 * 60_000;
const SHIELD_BLOCK_WINDOW_MS = 30 * 60_000;
const SHIELD_STRIKES_BEFORE_BLOCK = 5;

async function blockRequest(req: Request, res: Response, ip: string, reason: string, status = 403) {
  const strike = await incrementRateKey(`shield:strike:${ip}`, SHIELD_STRIKE_WINDOW_MS);
  if (strike.count >= SHIELD_STRIKES_BEFORE_BLOCK) {
    await incrementRateKey(`shield:block:${ip}`, SHIELD_BLOCK_WINDOW_MS);
  }

  await logAudit({
    action: "LOGIN_FAILED",
    entityType: "request_blocked",
    ipAddress: ip,
    details: JSON.stringify({
      reason,
      strikes: strike.count,
      method: req.method,
      path: req.path,
      userAgent: req.headers["user-agent"] ?? "unknown",
    }),
  });
  res.status(status).json({ error: status === 429 ? "Too many requests" : "Forbidden" });
}

export async function securityShield(req: Request, res: Response, next: NextFunction) {
  const ip = getClientIp(req);
  const method = req.method.toUpperCase();
  const userAgent = String(req.headers["user-agent"] ?? "");
  const path = req.path;

  const blocked = await getRateKey(`shield:block:${ip}`);
  if (blocked.count > 0 && blocked.resetAt > Date.now()) {
    await blockRequest(req, res, ip, "shield_quarantine", 429);
    return;
  }

  // Drop uncommon dangerous methods used in reconnaissance.
  if (BLOCKED_METHODS.has(method)) {
    await blockRequest(req, res, ip, "blocked_method", 405);
    return;
  }

  // Block known scan/probe paths early.
  if (BLOCKED_PATH_PATTERNS.some((pattern) => pattern.test(path))) {
    await blockRequest(req, res, ip, "blocked_path");
    return;
  }

  // Block known scanner clients by User-Agent fingerprint.
  if (userAgent && SCANNER_UA_PATTERN.test(userAgent)) {
    await blockRequest(req, res, ip, "scanner_user_agent");
    return;
  }

  const rawUrl = req.originalUrl ?? "";
  if (MALICIOUS_QUERY_PATTERN.test(rawUrl)) {
    await blockRequest(req, res, ip, "malicious_query_or_traversal");
    return;
  }

  // Global edge-style throttle for all requests.
  const globalLimit = await rateLimit(`global:${ip}`, 240, 60_000);
  if (!globalLimit.success) {
    await blockRequest(req, res, ip, "global_rate_limit", 429);
    return;
  }

  // Harden high-risk auth routes with tighter throughput.
  if (path.startsWith("/api/auth/")) {
    const authLimit = await rateLimit(`auth:${ip}`, 40, 60_000);
    if (!authLimit.success) {
      await blockRequest(req, res, ip, "auth_rate_limit", 429);
      return;
    }
  }

  next();
}
