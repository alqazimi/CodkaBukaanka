import {
  authSecretFromEnv,
  ensureHttpsUrl,
  getAuthSecretEnvDiagnostics,
  getSiteUrl,
  tryGetAuthSecret,
  type AuthSecretEnvDiagnostics,
} from "@/lib/env";

export type AuthConfigIssue =
  | "auth_secret_missing"
  | "auth_secret_too_short"
  | "auth_url_missing"
  | "api_url_missing";

export type AuthConfigStatus = {
  ready: boolean;
  issues: AuthConfigIssue[];
  messages: string[];
  diagnostics: AuthSecretEnvDiagnostics & { NODE_ENV: string };
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

function authSecretIssueMessage(diagnostics: AuthSecretEnvDiagnostics): string {
  const anySet = diagnostics.AUTH_SECRET_nonempty || diagnostics.NEXTAUTH_SECRET_nonempty;
  const anyDefined = diagnostics.AUTH_SECRET || diagnostics.NEXTAUTH_SECRET;

  if (!anyDefined && !anySet) {
    return "AUTH_SECRET is not visible at runtime on Vercel Production (unset or Preview-only scope). Add AUTH_SECRET (32+ chars) to Production, then redeploy.";
  }
  if (anySet && !diagnostics.AUTH_SECRET_length_ok && !diagnostics.NEXTAUTH_SECRET_length_ok) {
    const len = Math.max(diagnostics.AUTH_SECRET_length, diagnostics.NEXTAUTH_SECRET_length);
    return `AUTH_SECRET is set but too short at runtime (${len} chars; need 32+). Update the value on Vercel Production and redeploy.`;
  }
  return "AUTH_SECRET failed validation at runtime. Set a 32+ character secret on Vercel Production and redeploy.";
}

/** Runtime auth configuration check — no secrets exposed. */
export function getAuthConfigStatus(): AuthConfigStatus {
  const issues: AuthConfigIssue[] = [];
  const messages: string[] = [];
  const secretDiagnostics = getAuthSecretEnvDiagnostics();

  if (!authSecretFromEnv()) {
    issues.push("auth_secret_missing");
    messages.push(authSecretIssueMessage(secretDiagnostics));
  } else if (!tryGetAuthSecret()) {
    issues.push("auth_secret_too_short");
    messages.push(authSecretIssueMessage(secretDiagnostics));
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

  return {
    ready: Boolean(authSecretFromEnv()),
    issues,
    messages,
    diagnostics: {
      ...secretDiagnostics,
      NODE_ENV: process.env.NODE_ENV ?? "unknown",
    },
  };
}

/** Generic login-page copy — never expose env var names or deployment targets. */
export const AUTH_MISCONFIGURED_USER_MESSAGE =
  "Unable to sign in right now. Please try again in a moment.";

export function authConfigUserMessage(status: AuthConfigStatus): string | null {
  if (status.ready) return null;
  return AUTH_MISCONFIGURED_USER_MESSAGE;
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
