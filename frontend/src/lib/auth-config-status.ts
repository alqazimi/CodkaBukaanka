import { ensureHttpsUrl, getSiteUrl, tryGetAuthSecret } from "@/lib/env";

export type AuthConfigIssue =
  | "auth_secret_missing"
  | "auth_url_missing"
  | "api_url_missing";

export type AuthConfigStatus = {
  ready: boolean;
  issues: AuthConfigIssue[];
  messages: string[];
};

function resolveAuthUrl(): string | null {
  const raw =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "";
  if (!raw) return null;
  try {
    return ensureHttpsUrl(raw);
  } catch {
    return null;
  }
}

/** Runtime auth configuration check — no secrets exposed. */
export function getAuthConfigStatus(): AuthConfigStatus {
  const issues: AuthConfigIssue[] = [];
  const messages: string[] = [];

  if (!tryGetAuthSecret()) {
    issues.push("auth_secret_missing");
    messages.push(
      "AUTH_SECRET is missing on Vercel Production (must be 32+ characters, not Preview-only). Login cannot create a session until this is set."
    );
  }

  if (!resolveAuthUrl()) {
    issues.push("auth_url_missing");
    messages.push("AUTH_URL is missing. Set AUTH_URL=https://www.codkabukaanka.com on Vercel Production.");
  }

  try {
    getSiteUrl();
  } catch {
    /* site url optional for auth */
  }

  if (process.env.NODE_ENV === "production") {
    const api = process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!api) {
      issues.push("api_url_missing");
      messages.push("API_URL is missing on Vercel Production.");
    }
  }

  return { ready: issues.length === 0, issues, messages };
}

export function authConfigUserMessage(status: AuthConfigStatus): string | null {
  if (status.ready) return null;
  return status.messages[0] ?? "Authentication is misconfigured on the server.";
}

/** Auth.js / next-auth client error strings */
export function isAuthConfigurationError(error: unknown): boolean {
  if (!error) return false;
  const text = error instanceof Error ? error.message : String(error);
  return (
    /configuration/i.test(text) ||
    /AUTH_SECRET/i.test(text) ||
    /server configuration/i.test(text)
  );
}
