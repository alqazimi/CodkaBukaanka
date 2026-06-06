import { decryptTotpSecret, encryptTotpSecret } from "./secret-crypto.js";

export function sealTotpSecret(plaintext: string): string {
  return encryptTotpSecret(plaintext);
}

export function openTotpSecret(stored: string | null | undefined): string | null {
  return decryptTotpSecret(stored);
}

export function adminHasTotpConfigured(stored: string | null | undefined): boolean {
  return Boolean(openTotpSecret(stored));
}
