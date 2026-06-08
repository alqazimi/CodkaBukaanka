/** Paths the Next.js admin proxy may forward to the Railway backend. */
const ALLOWED_PREFIXES = ["api/admin/"] as const;

const ALLOWED_EXACT = new Set(["api/auth/action-token", "api/auth/logout"]);

function normalizeProxyPath(segments: string[]): string {
  return segments
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/")
    .replace(/^\/+/, "")
    .toLowerCase();
}

/** Reject path traversal and non-admin backend routes. */
export function isAllowedAdminProxyPath(segments: string[]): boolean {
  if (segments.some((segment) => segment === ".." || segment === "." || segment.includes("\\"))) {
    return false;
  }

  const path = normalizeProxyPath(segments);
  if (!path) return false;
  if (ALLOWED_EXACT.has(path)) return true;

  return ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
}
