import test from "node:test";
import assert from "node:assert/strict";
import {
  caseSubmissionSchema,
  validateSubmissionEvidenceRequirement,
} from "./case-submission-schema.js";

const baseInput = {
  submitterName: "Test User",
  submitterEmail: "test@example.com",
  title: "Sample case",
  reasonForVisit: "Routine visit",
  incidentDescription: "Something went wrong during treatment.",
  whatWentWrong: "OTHER" as const,
  category: "OTHER" as const,
  incidentDate: "2026-01-15",
  hospitalName: "City Hospital",
  patientName: "Patient One",
};

test("case submission accepts notes without files", () => {
  const parsed = caseSubmissionSchema.parse({
    ...baseInput,
    evidenceNotes: "Hospital record and witness statement available.",
  });
  assert.equal(validateSubmissionEvidenceRequirement(parsed, 0), null);
});

test("case submission accepts files without long notes", () => {
  const parsed = caseSubmissionSchema.parse({
    ...baseInput,
    evidenceNotes: "",
  });
  assert.equal(validateSubmissionEvidenceRequirement(parsed, 3), null);
});

test("case submission requires notes or files", () => {
  const parsed = caseSubmissionSchema.parse({
    ...baseInput,
    evidenceNotes: "",
  });
  assert.match(
    validateSubmissionEvidenceRequirement(parsed, 0) ?? "",
    /notes or upload/i
  );
});

test("case submission rejects too many files", () => {
  const parsed = caseSubmissionSchema.parse({
    ...baseInput,
    evidenceNotes: "Supporting documents attached.",
  });
  assert.match(validateSubmissionEvidenceRequirement(parsed, 21) ?? "", /at most 20/i);
});
