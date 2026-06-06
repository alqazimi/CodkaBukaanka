import test from "node:test";
import assert from "node:assert/strict";
import { decryptTotpSecret, encryptTotpSecret } from "./secret-crypto.js";

test("totp encryption round-trips when key is set", () => {
  const prev = process.env.TOTP_ENCRYPTION_KEY;
  process.env.TOTP_ENCRYPTION_KEY = "test-totp-encryption-key-32chars-min";
  try {
    const plain = "JBSWY3DPEHPK3PXP";
    const sealed = encryptTotpSecret(plain);
    assert.notEqual(sealed, plain);
    assert.equal(decryptTotpSecret(sealed), plain);
  } finally {
    if (prev === undefined) delete process.env.TOTP_ENCRYPTION_KEY;
    else process.env.TOTP_ENCRYPTION_KEY = prev;
  }
});

test("legacy plaintext totp secrets still decrypt", () => {
  const prev = process.env.TOTP_ENCRYPTION_KEY;
  process.env.TOTP_ENCRYPTION_KEY = "test-totp-encryption-key-32chars-min";
  try {
    assert.equal(decryptTotpSecret("JBSWY3DPEHPK3PXP"), "JBSWY3DPEHPK3PXP");
  } finally {
    if (prev === undefined) delete process.env.TOTP_ENCRYPTION_KEY;
    else process.env.TOTP_ENCRYPTION_KEY = prev;
  }
});
