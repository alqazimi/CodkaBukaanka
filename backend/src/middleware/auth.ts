import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { ADMIN_SESSION_MAX_AGE_SEC } from "../lib/session-config.js";

export type AuthPayload = { id: string; email: string; name: string; role: string };

type JwtClaims = AuthPayload & { tv?: number; role?: string };

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}

const JWT_OPTIONS = { algorithms: ["HS256" as const] };

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
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
    const decoded = jwt.verify(token, secret, JWT_OPTIONS) as JwtClaims;
    if (!decoded.id) {
      res.status(401).json({ error: "Invalid token" });
      return;
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

    if (!admin) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    if (!admin.active) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (decoded.tv === undefined || decoded.tv !== admin.tokenVersion) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    if (!["admin", "owner"].includes(admin.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function signToken(payload: AuthPayload & { tokenVersion?: number }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      tv: payload.tokenVersion ?? 0,
    },
    secret,
    { expiresIn: ADMIN_SESSION_MAX_AGE_SEC, algorithm: "HS256" }
  );
}
