import type { Request, Response, NextFunction } from "express";

export type AdminRole = "admin" | "owner";

export type Permission =
  | "cases:read"
  | "cases:write"
  | "cases:publish"
  | "entities:write"
  | "entities:merge"
  | "inbox:read"
  | "inbox:write"
  | "evidence:write"
  | "audit:read-own"
  | "audit:read-all"
  | "admins:manage"
  | "recycle:access"
  | "security:mfa";

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
  admin: new Set([
    "cases:read",
    "cases:write",
    "cases:publish",
    "entities:write",
    "inbox:read",
    "inbox:write",
    "evidence:write",
    "audit:read-own",
    "security:mfa",
  ]),
  owner: new Set([
    "cases:read",
    "cases:write",
    "cases:publish",
    "entities:write",
    "entities:merge",
    "inbox:read",
    "inbox:write",
    "evidence:write",
    "audit:read-own",
    "audit:read-all",
    "admins:manage",
    "recycle:access",
    "security:mfa",
  ]),
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role || (role !== "admin" && role !== "owner")) return false;
  return ROLE_PERMISSIONS[role].has(permission);
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.admin?.role;
    if (!role) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const allowed = permissions.some((p) => hasPermission(role, p));
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (req.admin?.role !== "owner") {
    res.status(403).json({ error: "Owner access required" });
    return;
  }
  next();
}
