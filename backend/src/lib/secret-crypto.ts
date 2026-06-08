import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGO = "aes-256-gcm";
const PREFIX = "v1:";

function deriveKey(): Buffer | null {
  const raw = process.env.TOTP_ENCRYPTION_KEY?.trim();
  if (!raw || raw.length < 32) return null;
  return scryptSync(raw, "diiwaanka-totp-v1", 32);
}

export function encryptTotpSecret(plaintext: string): string {
  const key = deriveKey();
  if (!key) {
    if (process.env.NODE_ENV === "production" && process.env.ENFORCE_ADMIN_TOTP === "true") {
      throw new Error("TOTP_ENCRYPTION_KEY is required to store authenticator secrets in production");
    }
    return plaintext;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptTotpSecret(stored: string | null | undefined): string | null {
  if (!stored) return null;
  if (!stored.startsWith(PREFIX)) return stored;

  const key = deriveKey();
  if (!key) return null;

  const body = stored.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = body.split(".");
  if (!ivB64 || !tagB64 || !dataB64) return null;

  try {
    const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    return null;
  }
}

export function hasTotpEncryptionKey(): boolean {
  return deriveKey() !== null;
}
