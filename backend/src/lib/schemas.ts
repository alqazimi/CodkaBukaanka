import { z } from "zod";

export const caseCategorySchema = z.enum([
  "WRONG_MEDICATION",
  "MEDICATION_ERROR",
  "MISDIAGNOSIS",
  "DELAYED_TREATMENT",
  "MEDICAL_NEGLIGENCE",
  "SURGICAL_ERROR",
  "PATIENT_SAFETY_INCIDENT",
  "HOSPITAL_COMPLAINT",
  "OTHER",
]);

export const caseStatusSchema = z.enum(["DRAFT", "UNDER_REVIEW", "VERIFIED", "PUBLISHED"]);

export const riskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const evidenceLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "VERIFIED"]);

export const whatWentWrongSchema = z.enum([
  "WRONG_MEDICATION",
  "WRONG_DOSAGE",
  "MISDIAGNOSIS",
  "DELAYED_TREATMENT",
  "NEGLIGENCE",
  "OTHER",
]);

export const evidenceVisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);

export const caseSchema = z.object({
  title: z.string().min(3).max(500),
  reasonForVisit: z.string().min(3).max(5000),
  incidentDescription: z.string().min(10).max(50000),
  currentCondition: z.string().max(5000).optional(),
  whatWentWrong: whatWentWrongSchema,
  category: caseCategorySchema,
  status: caseStatusSchema,
  riskLevel: riskLevelSchema,
  evidenceLevel: evidenceLevelSchema.optional(),
  incidentDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  hospitalId: z.string().uuid(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid().optional().nullable(),
  medicationId: z.string().uuid().optional().nullable(),
});

export const casePatchSchema = caseSchema.partial();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
