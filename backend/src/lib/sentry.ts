/** Optional Sentry — only initializes when SENTRY_DSN is set in production. */
export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn || process.env.NODE_ENV !== "production") return;

  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT ?? "production",
      tracesSampleRate: 0.1,
      beforeSend(event) {
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
        return event;
      },
    });
  } catch (err) {
    console.warn("[sentry] init skipped:", err instanceof Error ? err.message : err);
  }
}
