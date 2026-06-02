import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ADMIN_SESSION_MAX_AGE_SEC } from "../lib/session-config.js";

export type AuthPayload = { id: string; email: string; name: string; role: string };

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  const header = req.headers.authorization;
  const token =
    (header?.startsWith("Bearer ") ? header.slice(7) : null) ??
    (req.cookies?.admin_token as string | undefined);

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthPayload & { role?: string };
    if (!decoded.role || !["admin", "owner"].includes(decoded.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function signToken(payload: AuthPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.sign(payload, secret, { expiresIn: ADMIN_SESSION_MAX_AGE_SEC });
}
