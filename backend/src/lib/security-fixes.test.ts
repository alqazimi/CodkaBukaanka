import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertValidStatusTransition,
  CaseWorkflowError,
  isCreatableCaseStatus,
} from "./case-workflow.js";
import { PUBLIC_CASE_FILTER } from "./constants.js";
import { isSafeEvidenceUrl } from "./safe-url.js";
import { toPublicCase, PUBLIC_CASE_SELECT } from "./public-dto.js";
import { hasPermission, roleRequiresLoginTotp, roleRequiresMfaSetup } from "./rbac.js";
import { buildActionFingerprint } from "./action-token.js";

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

describe("public DTO layer", () => {
  it("strips admin-only case fields", () => {
    const sanitized = toPublicCase({
      id: "1",
      title: "Test",
      internalNotes: "secret admin note",
      authorId: "admin-1",
      hospitalId: "h-1",
      patientId: "p-1",
      deletedAt: new Date(),
    });
    assert.equal("internalNotes" in sanitized, false);
    assert.equal("authorId" in sanitized, false);
    assert.equal("hospitalId" in sanitized, false);
    assert.equal("patientId" in sanitized, false);
    assert.equal("deletedAt" in sanitized, false);
    assert.equal(sanitized.title, "Test");
  });

  it("public case select excludes internalNotes", () => {
    assert.equal("internalNotes" in PUBLIC_CASE_SELECT, false);
    assert.equal("authorId" in PUBLIC_CASE_SELECT, false);
  });
});

describe("RBAC", () => {
  it("only owner requires login TOTP", () => {
    assert.equal(roleRequiresLoginTotp("owner"), true);
    assert.equal(roleRequiresLoginTotp("admin"), false);
    assert.equal(roleRequiresMfaSetup("owner", true, false), true);
    assert.equal(roleRequiresMfaSetup("admin", true, false), false);
  });

  it("owner has recycle access, admin does not", () => {
    assert.equal(hasPermission("owner", "recycle:access"), true);
    assert.equal(hasPermission("admin", "recycle:access"), false);
    assert.equal(hasPermission("admin", "cases:write"), true);
  });

  it("rejects unknown roles", () => {
    assert.equal(hasPermission("superuser", "cases:write"), false);
  });
});

describe("action token fingerprint", () => {
  it("binds method and path", () => {
    assert.equal(
      buildActionFingerprint("DELETE", "/recycle-bin/case/abc"),
      "DELETE:/recycle-bin/case/abc"
    );
  });
});
