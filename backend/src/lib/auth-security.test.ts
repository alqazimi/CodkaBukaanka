import test from "node:test";
import assert from "node:assert/strict";
import {
  LOGIN_SECURITY_CONFIG,
  calculateProgressiveDelayMs,
  getBlockedLoginMessage,
  isRiskyLoginContext,
  shouldRequireCaptcha,
} from "./auth-security.js";
import { verifyCaptchaToken } from "./captcha.js";

test("progressive delay doubles and caps", () => {
  assert.equal(calculateProgressiveDelayMs(1), 500);
  assert.equal(calculateProgressiveDelayMs(2), 1000);
  assert.equal(calculateProgressiveDelayMs(3), 2000);
  assert.equal(calculateProgressiveDelayMs(4), 4000);
  assert.equal(calculateProgressiveDelayMs(10), 4000);
});

test("captcha requirement triggers at 2 failures", () => {
  assert.equal(shouldRequireCaptcha(0, 0), false);
  assert.equal(shouldRequireCaptcha(1, 1), false);
  assert.equal(shouldRequireCaptcha(2, 0), true);
  assert.equal(shouldRequireCaptcha(0, 2), true);
});

test("risk detection flags IP/UA changes after history exists", () => {
  assert.equal(isRiskyLoginContext(null, null, "1.1.1.1", "ua"), false);
  assert.equal(isRiskyLoginContext("1.1.1.1", "ua-a", "1.1.1.1", "ua-a"), false);
  assert.equal(isRiskyLoginContext("1.1.1.1", "ua-a", "2.2.2.2", "ua-a"), true);
  assert.equal(isRiskyLoginContext("1.1.1.1", "ua-a", "1.1.1.1", "ua-b"), true);
});

test("blocked login messages map correctly", () => {
  assert.equal(getBlockedLoginMessage("ip_blocked"), "Too many login attempts from this IP");
  assert.equal(getBlockedLoginMessage("locked"), "Account temporarily locked");
});

test("login security thresholds match brute-force policy", () => {
  assert.equal(LOGIN_SECURITY_CONFIG.ipFailLimit, 3);
  assert.equal(LOGIN_SECURITY_CONFIG.accountFailLimit, 5);
  assert.equal(LOGIN_SECURITY_CONFIG.captchaAfterFailures, 2);
});

test("captcha fails closed in production when provider is missing", async () => {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevVerifyUrl = process.env.CAPTCHA_VERIFY_URL;
  const prevSecret = process.env.CAPTCHA_SECRET;
  try {
    delete process.env.CAPTCHA_VERIFY_URL;
    delete process.env.CAPTCHA_SECRET;
    process.env.NODE_ENV = "production";
    const result = await verifyCaptchaToken(undefined, "1.2.3.4");
    assert.equal(result.ok, false);
    assert.equal(result.reason, "not_configured");
  } finally {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevVerifyUrl === undefined) delete process.env.CAPTCHA_VERIFY_URL;
    else process.env.CAPTCHA_VERIFY_URL = prevVerifyUrl;
    if (prevSecret === undefined) delete process.env.CAPTCHA_SECRET;
    else process.env.CAPTCHA_SECRET = prevSecret;
  }
});
