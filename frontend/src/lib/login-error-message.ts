const LOGIN_ERROR_CODES = new Set([
  "api_unreachable",
  "invalid_response",
  "origin_blocked",
  "captcha_not_configured",
  "require_captcha",
  "account_locked",
  "ip_blocked",
  "mfa_required",
  "mfa_invalid",
  "invalid_credentials",
]);

/** NextAuth v5 puts custom CredentialsSignin codes in `error`, not always `code`. */
export function resolveLoginErrorCode(
  error?: string | null,
  code?: string | null
): string | null {
  if (code && LOGIN_ERROR_CODES.has(code)) return code;
  if (error && LOGIN_ERROR_CODES.has(error)) return error;
  return code ?? error ?? null;
}

/** Map NextAuth sign-in errors to user-facing messages. */
export function getLoginErrorMessage(error?: string | null, code?: string | null): string {
  const resolved = resolveLoginErrorCode(error, code);
  if (resolved === "api_unreachable") {
    return "Unable to sign in right now. Please try again in a moment.";
  }
  if (resolved === "invalid_response") {
    return "Unable to sign in right now. Please try again.";
  }
  if (resolved === "origin_blocked") {
    return "Unable to sign in from this site. Please contact support.";
  }
  if (resolved === "captcha_not_configured") {
    return "Unable to sign in right now. Please contact support.";
  }
  if (resolved === "require_captcha") {
    return "Complete the security check below, then try again.";
  }
  if (resolved === "account_locked") {
    return "Too many failed attempts. Wait 1 minute and try again.";
  }
  if (resolved === "ip_blocked") {
    return "Too many failed attempts. Wait 1 minute and try again.";
  }
  if (resolved === "mfa_required") {
    return "Enter the 6-digit code from your authenticator app.";
  }
  if (resolved === "mfa_invalid") {
    return "That code was wrong or expired. Enter the current 6-digit code from your authenticator app.";
  }
  if (resolved === "invalid_credentials" || error === "CredentialsSignin") {
    return "Sign-in failed. Check your email and password.";
  }
  if (error === "Configuration" || code === "Configuration") {
    return "Session could not be created: AUTH_SECRET is missing on Vercel Production (enable Production scope, not Preview-only), then redeploy.";
  }
  if (error?.includes("2FA setup required") || error?.includes("Invalid MFA") || error?.includes("Captcha")) {
    return "Complete verification and try again.";
  }
  return error?.trim() || "Sign-in failed. Please try again.";
}

export function loginErrorNeedsCaptcha(message: string, code?: string | null): boolean {
  return (
    code === "require_captcha" ||
    code === "captcha_not_configured" ||
    message.includes("security check") ||
    message.includes("captcha token") ||
    message.includes("Captcha")
  );
}

/** Map admin API error payloads to user-facing messages. */
export function mapAdminApiError(
  status: number,
  error?: string | null,
  code?: string | null
): string {
  if (code === "api_unreachable") {
    return "Cannot reach the admin API. On Vercel set API_URL to your Railway URL (https://…). On Railway set FRONTEND_URL to your live site (https://…).";
  }
  if (code === "db_migration_required") {
    return "Database needs an update on Railway. Run: npx prisma migrate deploy (or redeploy after migrations are applied).";
  }
  if (code === "storage_not_configured") {
    return "File storage is not configured on Railway. Add CLOUDINARY_* variables, or set API_PUBLIC_URL to your Railway API URL (https://….up.railway.app).";
  }
  if (code === "cloudinary_required") {
    return "Cloudinary is required in production. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on Railway, then redeploy.";
  }
  if (code === "cloudinary_failed") {
    return "Cloudinary rejected the upload. Verify CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET on Railway.";
  }
  if (code === "mfa_setup_required") {
    return "Two-factor authentication is required for owner accounts. Open Security Center to set up Google Authenticator, then try again.";
  }
  if (code === "ip_not_allowed" || error?.includes("IP not allowed")) {
    return "Admin access is blocked by IP allowlist on Railway. Remove ADMIN_IP_ALLOWLIST or leave it empty for Vercel hosting.";
  }
  if (error?.includes("origin policy") || error?.includes("Origin required")) {
    return "Admin access blocked by origin policy. Set FRONTEND_URL on Railway to your exact live site URL (https://…).";
  }
  if (error?.includes("MFA setup required")) {
    return mapAdminApiError(status, null, "mfa_setup_required");
  }
  if (code === "invalid_admin_role" || error?.includes("valid admin role")) {
    return "This account does not have a valid admin role. Ask the site owner to set your role to admin or owner in the database.";
  }
  if (status === 403 && error?.trim() === "Forbidden") {
    return "Your admin session is out of date. Sign out, then sign in again.";
  }
  if (typeof error === "string" && error.trim()) return error.trim();
  return `Request failed (${status})`;
}
