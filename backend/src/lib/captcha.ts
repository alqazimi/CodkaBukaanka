type CaptchaVerifyResult = {
  ok: boolean;
  reason?: "missing" | "invalid" | "provider_error" | "not_configured";
};

const CAPTCHA_VERIFY_URL = process.env.CAPTCHA_VERIFY_URL?.trim();
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET?.trim();

export async function verifyCaptchaToken(
  token: string | undefined,
  ip: string
): Promise<CaptchaVerifyResult> {
  if (!CAPTCHA_VERIFY_URL || !CAPTCHA_SECRET) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "not_configured" };
    }
    // Dev: allow login without a captcha provider.
    return { ok: true, reason: "not_configured" };
  }

  if (!token) return { ok: false, reason: "missing" };

  try {
    const body = new URLSearchParams({
      secret: CAPTCHA_SECRET,
      response: token,
      remoteip: ip,
    });
    const res = await fetch(CAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return { ok: false, reason: "provider_error" };
    const data = (await res.json()) as { success?: boolean };
    return data.success ? { ok: true } : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "provider_error" };
  }
}
