/** Session cookie names — must match `cookies.sessionToken.name` in auth.ts */
export function getSessionCookieName(secure = process.env.NODE_ENV === "production"): string {
  return secure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
}

/** Fallback names when reading legacy Auth.js cookies */
export const LEGACY_SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const;
