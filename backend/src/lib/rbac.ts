import type { Request, Response, NextFunction } from "express";

export type AdminRole = "admin" | "owner";

/** Accepts DB values like "Admin" or " owner " and maps them to a known role. */
export function normalizeAdminRole(role: string | null | undefined): AdminRole | null {
  if (typeof role !== "string") return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin" || normalized === "owner") return normalized;
  return null;
}

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
  const normalized = normalizeAdminRole(role);
  if (!normalized) return false;
  return ROLE_PERMISSIONS[normalized].has(permission);
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

/** Opt-in only when ENFORCE_ADMIN_TOTP=true. Default: password (+ captcha when required) for all roles. */
export function isAdminTotpEnforced(): boolean {
  return process.env.ENFORCE_ADMIN_TOTP === "true";
}

export function roleRequiresLoginTotp(role: string): boolean {
  return isAdminTotpEnforced() && normalizeAdminRole(role) === "owner";
}

export function roleRequiresMfaSetup(
  role: string,
  enforceTotp: boolean,
  totpEnabled: boolean
): boolean {
  return enforceTotp && normalizeAdminRole(role) === "owner" && !totpEnabled;
}
