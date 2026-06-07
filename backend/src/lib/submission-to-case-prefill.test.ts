import test from "node:test";
import assert from "node:assert/strict";
import { namesMatch, normalizeEntityName } from "./submission-to-case-prefill.js";

test("normalizes names for comparison", () => {
  assert.equal(normalizeEntityName("  Banadir   Hospital "), "banadir hospital");
});

test("matches exact and partial hospital names", () => {
  assert.equal(namesMatch("Banadir Hospital", "banadir hospital"), true);
  assert.equal(namesMatch("Mogadishu Banadir Hospital", "Banadir Hospital"), true);
  assert.equal(namesMatch("ABC Clinic", "XYZ Hospital"), false);
});
