import { verify } from "otplib";

/** Allow ±1 TOTP step (30s) for clock drift between server and authenticator app. */
export async function verifyAdminTotp(token: string, secret: string | null | undefined): Promise<boolean> {
  if (!secret || !/^\d{6}$/.test(token)) return false;
  const result = await verify({ token, secret, epochTolerance: 1 });
  return result.valid === true;
}
