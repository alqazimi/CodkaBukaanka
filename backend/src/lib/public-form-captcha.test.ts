import test from "node:test";
import assert from "node:assert/strict";
import { verifyPublicFormCaptcha } from "./public-form-captcha.js";

test("public form captcha skips verification when provider is not configured", async () => {
  const prevUrl = process.env.CAPTCHA_VERIFY_URL;
  const prevSecret = process.env.CAPTCHA_SECRET;
  const prevNodeEnv = process.env.NODE_ENV;

  delete process.env.CAPTCHA_VERIFY_URL;
  delete process.env.CAPTCHA_SECRET;
  process.env.NODE_ENV = "production";

  try {
    const result = await verifyPublicFormCaptcha(undefined, "127.0.0.1");
    assert.equal(result.ok, true);
  } finally {
    if (prevUrl === undefined) delete process.env.CAPTCHA_VERIFY_URL;
    else process.env.CAPTCHA_VERIFY_URL = prevUrl;
    if (prevSecret === undefined) delete process.env.CAPTCHA_SECRET;
    else process.env.CAPTCHA_SECRET = prevSecret;
    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
  }
});

test("public form captcha requires token when provider is configured", async () => {
  const prevUrl = process.env.CAPTCHA_VERIFY_URL;
  const prevSecret = process.env.CAPTCHA_SECRET;

  process.env.CAPTCHA_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  process.env.CAPTCHA_SECRET = "test-secret";

  try {
    const result = await verifyPublicFormCaptcha(undefined, "127.0.0.1");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /security check/i);
    }
  } finally {
    if (prevUrl === undefined) delete process.env.CAPTCHA_VERIFY_URL;
    else process.env.CAPTCHA_VERIFY_URL = prevUrl;
    if (prevSecret === undefined) delete process.env.CAPTCHA_SECRET;
    else process.env.CAPTCHA_SECRET = prevSecret;
  }
});
