import { z } from "zod";
import { caseCategorySchema, whatWentWrongSchema } from "./schemas.js";
import { MAX_SUBMISSION_EVIDENCE_FILES } from "./submission-evidence-upload.js";

export const CASE_SUBMISSION_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const caseSubmissionSchema = z
  .object({
    submitterName: z.string().min(2).max(100),
    submitterEmail: z.string().email().max(255),
    submitterPhone: z.string().max(40).optional(),
    title: z.string().min(3).max(500),
    reasonForVisit: z.string().min(3).max(5000),
    incidentDescription: z.string().min(10).max(50000),
    currentCondition: z.string().max(5000).optional(),
    whatWentWrong: whatWentWrongSchema,
    category: caseCategorySchema,
    incidentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hospitalName: z.string().min(2).max(200),
    hospitalLocation: z.string().max(200).optional(),
    patientName: z.string().min(2).max(200),
    patientAge: z.coerce.number().int().min(0).max(130).optional(),
    patientGender: z.enum(["male", "female", "other", "unknown"]).optional(),
    doctorName: z.string().max(200).optional(),
    medicationName: z.string().max(200).optional(),
    evidenceNotes: z.string().max(10000).optional(),
    website: z.string().max(200).optional(),
    startedAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const notes = (data.evidenceNotes ?? "").trim();
    if (notes.length > 0 && notes.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Evidence notes must be at least 10 characters when provided.",
        path: ["evidenceNotes"],
      });
    }
  });

export type CaseSubmissionInput = z.infer<typeof caseSubmissionSchema>;

export function caseSubmissionTextFields(input: CaseSubmissionInput): string[] {
  return [
    input.submitterName,
    input.submitterEmail,
    input.submitterPhone ?? "",
    input.title,
    input.reasonForVisit,
    input.incidentDescription,
    input.currentCondition ?? "",
    input.hospitalName,
    input.hospitalLocation ?? "",
    input.patientName,
    input.doctorName ?? "",
    input.medicationName ?? "",
    input.evidenceNotes ?? "",
  ];
}

export function validateSubmissionEvidenceRequirement(
  input: CaseSubmissionInput,
  fileCount: number
): string | null {
  if (fileCount > MAX_SUBMISSION_EVIDENCE_FILES) {
    return `You can upload at most ${MAX_SUBMISSION_EVIDENCE_FILES} files.`;
  }
  const notes = (input.evidenceNotes ?? "").trim();
  if (fileCount === 0 && notes.length < 10) {
    return "Add evidence notes or upload at least one file (photo, video, or document).";
  }
  return null;
}
