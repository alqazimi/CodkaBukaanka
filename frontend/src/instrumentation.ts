export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logAuthSecretEnvPresence } = await import("./lib/env");
    logAuthSecretEnvPresence();
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.server.config");
  }
}

export async function onRequestError(
  err: Error,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  const dsn = process.env.SENTRY_DSN?.trim() ?? process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn || process.env.NODE_ENV !== "production") return;

  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(err, {
    extra: {
      path: request.path,
      method: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
    },
  });
}
