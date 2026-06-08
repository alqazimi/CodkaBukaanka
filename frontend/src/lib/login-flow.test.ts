import assert from "node:assert/strict";
import test from "node:test";
import {
  getLoginErrorMessage,
  loginErrorNeedsCaptcha,
  resolveLoginErrorCode,
} from "./login-error-message";

test("require_captcha message is generic", () => {
  const msg = getLoginErrorMessage(null, "require_captcha");
  assert.match(msg, /security check/i);
  assert.doesNotMatch(msg, /owner|admin role|Vercel|Railway/i);
});

test("loginErrorNeedsCaptcha includes require_captcha code", () => {
  assert.equal(loginErrorNeedsCaptcha("", "require_captcha"), true);
  assert.equal(loginErrorNeedsCaptcha("random", "invalid_credentials"), false);
});

test("resolveLoginErrorCode reads NextAuth error field", () => {
  assert.equal(resolveLoginErrorCode("mfa_invalid", undefined), "mfa_invalid");
  assert.equal(resolveLoginErrorCode("CredentialsSignin", "mfa_invalid"), "mfa_invalid");
});

test("mfa_invalid message does not reveal account roles", () => {
  const msg = getLoginErrorMessage("mfa_invalid", undefined);
  assert.match(msg, /authenticator/i);
  assert.doesNotMatch(msg, /owner|admin/i);
});

test("invalid_credentials message stays generic", () => {
  const msg = getLoginErrorMessage("invalid_credentials", undefined);
  assert.match(msg, /email and password/i);
  assert.doesNotMatch(msg, /authenticator|owner/i);
});

test("Configuration error stays generic on login page", () => {
  const msg = getLoginErrorMessage("Configuration", undefined);
  assert.match(msg, /unable to sign in/i);
  assert.doesNotMatch(msg, /AUTH_SECRET|Vercel|Preview-only|redeploy/i);
});
