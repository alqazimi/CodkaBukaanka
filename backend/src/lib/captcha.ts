type CaptchaVerifyResult = {
  ok: boolean;
  reason?: "missing" | "invalid" | "provider_error" | "not_configured";
};

function captchaConfig(): { verifyUrl: string; secret: string } | null {
  const verifyUrl = process.env.CAPTCHA_VERIFY_URL?.trim() ?? "";
  const secret = process.env.CAPTCHA_SECRET?.trim() ?? "";
  if (!verifyUrl || !secret) return null;
  return { verifyUrl, secret };
}

export function isCaptchaConfigured(): boolean {
  return captchaConfig() !== null;
}

export async function verifyCaptchaToken(
  token: string | undefined,
  ip: string
): Promise<CaptchaVerifyResult> {
  const config = captchaConfig();
  if (!config) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "not_configured" };
    }
    // Dev: allow login without a captcha provider.
    return { ok: true, reason: "not_configured" };
  }

  if (!token) return { ok: false, reason: "missing" };

  try {
    const body = new URLSearchParams({
      secret: config.secret,
      response: token,
      remoteip: ip,
    });
    const res = await fetch(config.verifyUrl, {
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
