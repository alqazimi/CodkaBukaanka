import { isCaptchaConfigured, verifyCaptchaToken } from "./captcha.js";

const CAPTCHA_ERRORS: Record<string, string> = {
  missing: "Complete the security check and try again.",
  invalid: "Security check failed. Refresh the page and try again.",
  not_configured: "Security verification is temporarily unavailable.",
  provider_error: "Security check could not be verified. Try again later.",
};

/** Verify Turnstile on public contact/submission forms when CAPTCHA_* env vars are set. */
export async function verifyPublicFormCaptcha(
  token: string | undefined,
  ip: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isCaptchaConfigured()) {
    return { ok: true };
  }

  const result = await verifyCaptchaToken(token, ip);
  if (result.ok) return { ok: true };

  const reason = result.reason ?? "invalid";
  return { ok: false, error: CAPTCHA_ERRORS[reason] ?? CAPTCHA_ERRORS.invalid };
}
