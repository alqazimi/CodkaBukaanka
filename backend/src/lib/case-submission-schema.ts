import { z } from "zod";
import { caseCategorySchema, whatWentWrongSchema } from "./schemas.js";

export const CASE_SUBMISSION_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const caseSubmissionSchema = z.object({
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
  evidenceNotes: z.string().min(10).max(10000),
  website: z.string().max(200).optional(),
  startedAt: z.string().optional(),
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
    input.evidenceNotes,
  ];
}
