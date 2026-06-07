/** Max session length (absolute), in seconds — must match backend JWT/cookie. */
export const ADMIN_SESSION_MAX_AGE_SEC = 30 * 60;

/** Log out after this many ms with no mouse/keyboard/scroll activity. */
export const ADMIN_IDLE_TIMEOUT_MS = 28 * 60 * 1000;

/** Refresh backend JWT on this interval while the admin tab is open. */
export const ADMIN_TOKEN_REFRESH_INTERVAL_MS = 8 * 60 * 1000;
