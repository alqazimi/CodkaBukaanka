export type AdminRole = "admin" | "owner";

/** Match backend normalizeAdminRole — accepts "Owner", " owner ", etc. */
export function normalizeAdminRole(role: string | null | undefined): AdminRole | null {
  if (typeof role !== "string") return null;
  const normalized = role.trim().toLowerCase();
  if (normalized === "admin" || normalized === "owner") return normalized;
  return null;
}

export function isAdminOwner(role: string | null | undefined): boolean {
  return normalizeAdminRole(role) === "owner";
}
