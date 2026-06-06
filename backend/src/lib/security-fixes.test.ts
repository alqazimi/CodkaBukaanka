import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertValidStatusTransition,
  CaseWorkflowError,
  isCreatableCaseStatus,
} from "./case-workflow.js";
import { PUBLIC_CASE_FILTER } from "./constants.js";
import { isSafeEvidenceUrl } from "./safe-url.js";

describe("case workflow", () => {
  it("allows DRAFT to UNDER_REVIEW", () => {
    assert.doesNotThrow(() => assertValidStatusTransition("DRAFT", "UNDER_REVIEW"));
  });

  it("blocks DRAFT to PUBLISHED", () => {
    assert.throws(
      () => assertValidStatusTransition("DRAFT", "PUBLISHED"),
      CaseWorkflowError
    );
  });

  it("only allows creatable statuses on new cases", () => {
    assert.equal(isCreatableCaseStatus("DRAFT"), true);
    assert.equal(isCreatableCaseStatus("PUBLISHED"), false);
  });
});

describe("public case filter", () => {
  it("only exposes PUBLISHED non-deleted cases", () => {
    assert.deepEqual(PUBLIC_CASE_FILTER, { status: "PUBLISHED", deletedAt: null });
  });
});

describe("safe evidence urls", () => {
  it("accepts cloudinary https urls", () => {
    assert.equal(
      isSafeEvidenceUrl("https://res.cloudinary.com/demo/image/upload/v1/sample.jpg"),
      true
    );
  });

  it("rejects javascript urls", () => {
    assert.equal(isSafeEvidenceUrl("javascript:alert(1)"), false);
  });
});
