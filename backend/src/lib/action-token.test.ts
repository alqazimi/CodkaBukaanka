import test from "node:test";
import assert from "node:assert/strict";
import { signActionToken, consumeActionToken } from "./action-token.js";

test("action tokens are one-time use", async () => {
  const prev = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-jwt-secret-minimum-32-characters-long";
  try {
    const adminId = "admin-123";
    const token = signActionToken(adminId, "admin:destructive");
    const fp = "DELETE:/recycle-bin/case/abc";

    assert.equal(await consumeActionToken(token, adminId, "admin:destructive", fp), true);
    assert.equal(await consumeActionToken(token, adminId, "admin:destructive", fp), false);
  } finally {
    if (prev === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = prev;
  }
});
