import assert from "node:assert/strict";
import test from "node:test";
import {
  getLoginErrorMessage,
  loginErrorNeedsCaptcha,
  resolveLoginErrorCode,
} from "./login-error-message";

test("require_captcha message points to fresh authenticator step", () => {
  const msg = getLoginErrorMessage(null, "require_captcha");
  assert.match(msg, /fresh authenticator code/i);
  assert.doesNotMatch(msg, /paste.*token/i);
});

test("loginErrorNeedsCaptcha includes require_captcha code", () => {
  assert.equal(loginErrorNeedsCaptcha("", "require_captcha"), true);
  assert.equal(loginErrorNeedsCaptcha("random", "invalid_credentials"), false);
});

test("resolveLoginErrorCode reads NextAuth error field", () => {
  assert.equal(resolveLoginErrorCode("mfa_invalid", undefined), "mfa_invalid");
  assert.equal(resolveLoginErrorCode("CredentialsSignin", "mfa_invalid"), "mfa_invalid");
});

test("mfa_invalid message mentions fresh authenticator code", () => {
  const msg = getLoginErrorMessage("mfa_invalid", undefined);
  assert.match(msg, /authenticator code/i);
  assert.doesNotMatch(msg, /email, password/i);
});
