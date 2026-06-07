const LOGIN_ERROR_CODES = new Set([
  "api_unreachable",
  "invalid_response",
  "origin_blocked",
  "captcha_not_configured",
  "require_captcha",
  "account_locked",
  "ip_blocked",
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
    return "Cannot reach the API server. Check that the backend is running and API_URL on Vercel points to Railway.";
  }
  if (resolved === "invalid_response") {
    return "Sign-in failed: the server returned an unexpected response. Try again or contact support.";
  }
  if (resolved === "origin_blocked") {
    return "Sign-in blocked by server policy. Ensure FRONTEND_URL on Railway matches your live site URL exactly (https://…).";
  }
  if (resolved === "captcha_not_configured") {
    return "Security verification is not set up on the server. Add Cloudflare Turnstile keys: CAPTCHA_VERIFY_URL and CAPTCHA_SECRET on Railway, and NEXT_PUBLIC_TURNSTILE_SITE_KEY on Vercel, then redeploy.";
  }
  if (resolved === "require_captcha") {
    return "Security check required. Complete the verification box, then enter a fresh authenticator code.";
  }
  if (resolved === "account_locked") {
    return "This account is temporarily locked after too many failed attempts. Wait 30 minutes and try again.";
  }
  if (resolved === "ip_blocked") {
    return "Too many login attempts from your network. Wait 15 minutes and try again.";
  }
  if (resolved === "mfa_invalid") {
    return "That authenticator code expired or was wrong. Open Google Authenticator and enter the new 6-digit code shown now.";
  }
  if (resolved === "invalid_credentials" || error === "CredentialsSignin") {
    return "Sign-in failed. Check your email, password, and the current 6-digit authenticator code.";
  }
  if (error === "Configuration") {
    return "Sign-in failed. Check your email, password, and authenticator code. If this keeps happening, verify AUTH_SECRET and API_URL are set correctly.";
  }
  if (error?.includes("2FA setup required")) {
    return "2FA is required. Sign in once with enforcement off, open Admin → Security, enable Authenticator, then sign in again with your 6-digit code.";
  }
  if (error?.includes("Invalid MFA")) {
    return "Invalid authenticator code. Open your app (Google Authenticator / Authy) and enter the current 6-digit code.";
  }
  if (error?.includes("Captcha")) {
    return "Additional verification is required. Complete the security check below and try again.";
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
  if (code === "cloudinary_failed") {
    return "Cloudinary rejected the upload. Verify CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET on Railway.";
  }
  if (code === "mfa_setup_required") {
    return "Your Google Authenticator is linked but not activated yet. Open Admin → Security, enter your current 6-digit code under “Verify and enable”, or sign out and sign in with password + the same authenticator code.";
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
  if (typeof error === "string" && error.trim()) return error.trim();
  return `Request failed (${status})`;
}
