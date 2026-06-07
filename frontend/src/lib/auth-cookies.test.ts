import test from "node:test";
import assert from "node:assert/strict";
import { getSessionCookieName, LEGACY_SESSION_COOKIE_NAMES } from "./auth-cookies.js";

test("session cookie name uses secure prefix in production", () => {
  assert.equal(getSessionCookieName(true), "__Secure-next-auth.session-token");
  assert.equal(getSessionCookieName(false), "next-auth.session-token");
});

test("legacy session cookie names are defined", () => {
  assert.ok(LEGACY_SESSION_COOKIE_NAMES.includes("authjs.session-token"));
});
