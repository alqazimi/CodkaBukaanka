import test from "node:test";
import assert from "node:assert/strict";
import { translatePublicFormError } from "./public-form-errors.js";

const t = (key: string) => `tr:${key}`;

test("translatePublicFormError maps captcha messages", () => {
  assert.equal(
    translatePublicFormError("Complete the security check and try again.", t),
    "tr:captchaRequired"
  );
});

test("translatePublicFormError maps rate limit messages", () => {
  assert.equal(translatePublicFormError("Too many requests", t), "tr:rateLimited");
});

test("translatePublicFormError falls back for unknown errors", () => {
  assert.equal(translatePublicFormError("Something odd happened", t), "Something odd happened");
});

test("translatePublicFormError uses fallback key when empty", () => {
  assert.equal(translatePublicFormError("", t, "error"), "tr:error");
});
