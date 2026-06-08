import test from "node:test";
import assert from "node:assert/strict";
import { isAllowedAdminProxyPath } from "./admin-proxy-allowlist.js";
import { serializeJsonLd } from "./safe-json-ld.js";

test("admin proxy allowlist accepts admin API paths", () => {
  assert.equal(isAllowedAdminProxyPath(["api", "admin", "cases"]), true);
  assert.equal(isAllowedAdminProxyPath(["api", "auth", "action-token"]), true);
});

test("admin proxy allowlist rejects traversal and non-admin paths", () => {
  assert.equal(isAllowedAdminProxyPath(["api", "admin", "..", "auth", "login"]), false);
  assert.equal(isAllowedAdminProxyPath(["api", "auth", "login"]), false);
  assert.equal(isAllowedAdminProxyPath(["api", "public", "contact"]), false);
});

test("serializeJsonLd escapes script breakouts", () => {
  const payload = serializeJsonLd({ title: "</script><script>alert(1)</script>" });
  assert.doesNotMatch(payload, /<\/script>/i);
  assert.match(payload, /\\u003c/);
});
