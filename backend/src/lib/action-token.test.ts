import test from "node:test";
import assert from "node:assert/strict";
import { signActionToken, consumeActionToken, buildActionFingerprint } from "./action-token.js";

test("action tokens are one-time use and bound to method+path", async () => {
  const prev = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-jwt-secret-minimum-32-characters-long";
  try {
    const adminId = "admin-123";
    const fp = buildActionFingerprint("DELETE", "/cases/abc");
    const token = signActionToken(adminId, "admin:destructive", fp);

    assert.equal(await consumeActionToken(token, adminId, "admin:destructive", fp), true);
    assert.equal(await consumeActionToken(token, adminId, "admin:destructive", fp), false);
    assert.equal(
      await consumeActionToken(token, adminId, "admin:destructive", buildActionFingerprint("DELETE", "/cases/other")),
      false
    );
  } finally {
    if (prev === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prev;
  }
});
