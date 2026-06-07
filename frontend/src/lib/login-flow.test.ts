import assert from "node:assert/strict";
import test from "node:test";
import { getLoginErrorMessage, loginErrorNeedsCaptcha } from "./login-error-message";

test("require_captcha message points to fresh authenticator step", () => {
  const msg = getLoginErrorMessage(null, "require_captcha");
  assert.match(msg, /fresh authenticator code/i);
  assert.doesNotMatch(msg, /paste.*token/i);
});

test("loginErrorNeedsCaptcha includes require_captcha code", () => {
  assert.equal(loginErrorNeedsCaptcha("", "require_captcha"), true);
  assert.equal(loginErrorNeedsCaptcha("random", "invalid_credentials"), false);
});
