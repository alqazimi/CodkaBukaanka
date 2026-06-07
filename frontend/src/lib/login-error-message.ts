/** Map NextAuth sign-in errors to user-facing messages. */
export function getLoginErrorMessage(error?: string | null, code?: string | null): string {
  if (code === "api_unreachable") {
    return "Cannot reach the API server. Check that the backend is running and API_URL on Vercel points to Railway.";
  }
  if (code === "invalid_response") {
    return "Sign-in failed: the server returned an unexpected response. Try again or contact support.";
  }
  if (code === "origin_blocked") {
    return "Sign-in blocked by server policy. Ensure FRONTEND_URL on Railway matches your live site URL exactly (https://…).";
  }
  if (code === "captcha_not_configured") {
    return "Security verification is not set up on the server. Add Cloudflare Turnstile keys: CAPTCHA_VERIFY_URL and CAPTCHA_SECRET on Railway, and NEXT_PUBLIC_TURNSTILE_SITE_KEY on Vercel, then redeploy.";
  }
  if (code === "require_captcha") {
    return "Security check required. Complete the verification box, then enter a fresh authenticator code.";
  }
  if (code === "account_locked") {
    return "This account is temporarily locked after too many failed attempts. Wait 30 minutes and try again.";
  }
  if (code === "ip_blocked") {
    return "Too many login attempts from your network. Wait 15 minutes and try again.";
  }
  if (code === "mfa_invalid") {
    return "Enter the current 6-digit code from Google Authenticator (same account you already set up). That code activates admin access—do not leave the field empty.";
  }
  if (code === "invalid_credentials" || error === "CredentialsSignin") {
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
