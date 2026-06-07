import type { CaseCategory, CaseStatus, EvidenceLevel, WhatWentWrong, RiskLevel, Prisma } from "@prisma/client";

export const PUBLIC_CASE_FILTER: Prisma.CaseWhereInput = {
  status: "PUBLISHED",
  deletedAt: null,
};

export const NOT_DELETED = { deletedAt: null } as const;

export type { CaseCategory, CaseStatus, EvidenceLevel, WhatWentWrong, RiskLevel };

export const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-slate-50 text-slate-700 border-slate-200",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
  HIGH: "bg-orange-50 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-50 text-red-800 border-red-200",
};

export const WHAT_WENT_WRONG_LABELS: Record<WhatWentWrong, string> = {
  WRONG_MEDICATION: "Wrong Medication",
  WRONG_DOSAGE: "Wrong Dosage",
  MISDIAGNOSIS: "Misdiagnosis",
  DELAYED_TREATMENT: "Delayed Treatment",
  NEGLIGENCE: "Negligence",
  OTHER: "Other",
};

export const CATEGORIES: CaseCategory[] = [
  "WRONG_MEDICATION",
  "MEDICATION_ERROR",
  "MISDIAGNOSIS",
  "DELAYED_TREATMENT",
  "MEDICAL_NEGLIGENCE",
  "SURGICAL_ERROR",
  "PATIENT_SAFETY_INCIDENT",
  "HOSPITAL_COMPLAINT",
  "OTHER",
];

export const CATEGORY_LABELS: Record<CaseCategory, string> = {
  WRONG_MEDICATION: "Wrong Medication",
  MEDICATION_ERROR: "Medication Error",
  MISDIAGNOSIS: "Misdiagnosis",
  DELAYED_TREATMENT: "Delayed Treatment",
  MEDICAL_NEGLIGENCE: "Medical Negligence",
  SURGICAL_ERROR: "Surgical Error",
  PATIENT_SAFETY_INCIDENT: "Patient Safety Incident",
  HOSPITAL_COMPLAINT: "Hospital Complaint",
  OTHER: "Other",
};

export const STATUS_LABELS: Record<CaseStatus, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  PUBLISHED: "Published",
};

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  VERIFIED: "Verified",
};

export const ALLOWED_UPLOAD_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/** Max size per uploaded evidence file (photos, videos, PDFs). */
export const MAX_UPLOAD_MB = 50;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Max combined size for all files in one public case submission. */
export const MAX_SUBMISSION_TOTAL_MB = 100;
export const MAX_SUBMISSION_TOTAL_BYTES = MAX_SUBMISSION_TOTAL_MB * 1024 * 1024;
