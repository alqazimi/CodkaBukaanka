import test from "node:test";
import assert from "node:assert/strict";
import { LOGIN_SECURITY_CONFIG } from "./auth-security.js";
import { getRateKey, incrementRateKey, resetRateKey } from "./rate-limit-store.js";

test("IP failure counter blocks after configured limit", async () => {
  const ipKey = "login:fail-ip:test-ip-block";
  const blockedKey = "login:blocked-ip:test-ip-block";
  await resetRateKey(ipKey);
  await resetRateKey(blockedKey);

  for (let i = 1; i <= LOGIN_SECURITY_CONFIG.ipFailLimit; i++) {
    const track = await incrementRateKey(ipKey, LOGIN_SECURITY_CONFIG.ipWindowMs);
    assert.equal(track.count, i);
    if (track.count >= LOGIN_SECURITY_CONFIG.ipFailLimit) {
      await incrementRateKey(blockedKey, LOGIN_SECURITY_CONFIG.ipBlockMs);
    }
  }

  const blocked = await getRateKey(blockedKey);
  assert.ok(blocked.count > 0);
  assert.ok(blocked.resetAt > Date.now());
});
