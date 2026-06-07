/** Max session length (absolute), in seconds — must match backend JWT/cookie. */
export const ADMIN_SESSION_MAX_AGE_SEC = 3 * 60 * 60;

/** Refresh backend JWT on this interval while the admin tab is open. */
export const ADMIN_TOKEN_REFRESH_INTERVAL_MS = 45 * 60 * 1000;

/** Match backend `ADMIN_SESSION_REFRESH_GRACE_SEC` — used when redirecting to refresh instead of logout. */
export const ADMIN_SESSION_REFRESH_GRACE_MS = 5 * 60 * 1000;

/** Do not force logout on the first refresh failures right after login/navigation. */
export const ADMIN_SESSION_REFRESH_STARTUP_GRACE_MS = 45 * 1000;
