/** Max admin session length — keep in sync with frontend `admin-session.ts`. */
export const ADMIN_SESSION_MAX_AGE_SEC = 30 * 60;

export const ADMIN_SESSION_MAX_AGE_MS = ADMIN_SESSION_MAX_AGE_SEC * 1000;

/** Allow refresh for this long after JWT `exp` (seconds). */
export const ADMIN_SESSION_REFRESH_GRACE_SEC = 5 * 60;
