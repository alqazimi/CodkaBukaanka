/** Map NextAuth sign-in errors to user-facing messages. */
export function getLoginErrorMessage(error?: string | null, code?: string | null): string {
  if (code === "api_unreachable") {
    return "Cannot reach the API server. Make sure the backend is running (npm run dev) and API_URL points to it.";
  }
  if (code === "invalid_response") {
    return "Sign-in failed: the server returned an unexpected response. Try again or contact support.";
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
    return "Additional verification is required. Enter your captcha token below and try again.";
  }
  return error?.trim() || "Sign-in failed. Please try again.";
}

export function loginErrorNeedsCaptcha(message: string): boolean {
  return message.includes("captcha token") || message.includes("Captcha");
}
