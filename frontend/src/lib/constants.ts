import type { CaseCategory, CaseStatus, WhatWentWrong, EvidenceLevel, RiskLevel } from "@/types/entities";

export const WHAT_WENT_WRONG: WhatWentWrong[] = [
  "WRONG_MEDICATION",
  "WRONG_DOSAGE",
  "MISDIAGNOSIS",
  "DELAYED_TREATMENT",
  "NEGLIGENCE",
  "OTHER",
];

export const WHAT_WENT_WRONG_LABELS: Record<WhatWentWrong, { en: string; so: string }> = {
  WRONG_MEDICATION: { en: "Wrong Medication", so: "Daawo khaldan" },
  WRONG_DOSAGE: { en: "Wrong Dosage", so: "Qiyaas daawo khaldan" },
  MISDIAGNOSIS: { en: "Misdiagnosis", so: "Cudur-sheegid khaldan" },
  DELAYED_TREATMENT: { en: "Delayed Treatment", so: "Daahitaan daaweyn" },
  NEGLIGENCE: { en: "Negligence", so: "Dayac caafimaad" },
  OTHER: { en: "Other", so: "Wax kale" },
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

export const CATEGORY_LABELS: Record<CaseCategory, { en: string; so: string }> = {
  WRONG_MEDICATION: { en: "Wrong Medication", so: "Daawo khaldan" },
  MEDICATION_ERROR: { en: "Medication Error", so: "Khalad daawo" },
  MISDIAGNOSIS: { en: "Misdiagnosis", so: "Cudur-sheegid khaldan" },
  DELAYED_TREATMENT: { en: "Delayed Treatment", so: "Daahitaan daaweyn" },
  MEDICAL_NEGLIGENCE: { en: "Medical Negligence", so: "Dayac caafimaad" },
  SURGICAL_ERROR: { en: "Surgical Error", so: "Khalad qalliin" },
  PATIENT_SAFETY_INCIDENT: { en: "Patient Safety Incident", so: "Dhacdo badbaadada bukaanka" },
  HOSPITAL_COMPLAINT: { en: "Hospital Complaint", so: "Cabashada isbitaalka" },
  OTHER: { en: "Other", so: "Wax kale" },
};

export const STATUS_LABELS: Record<CaseStatus, { en: string; so: string }> = {
  DRAFT: { en: "Draft", so: "Qabyo" },
  UNDER_REVIEW: { en: "Under Review", so: "Waa la eegayaa" },
  VERIFIED: { en: "Verified", so: "La xaqiijiyay" },
  PUBLISHED: { en: "Published", so: "La daabacay" },
};

/** Red-scale badges — unified with site dark glass theme */
export const STATUS_COLORS: Record<CaseStatus, string> = {
  DRAFT: "border border-white/10 bg-white/5 text-red-200/70",
  UNDER_REVIEW: "border border-red-400/25 bg-red-950/30 text-red-200",
  VERIFIED: "border border-red-400/40 bg-red-950/40 text-red-100",
  PUBLISHED: "border border-red-400/50 bg-red-600/25 text-red-50",
};

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, { en: string; so: string }> = {
  LOW: { en: "Low", so: "Heer hoose" },
  MEDIUM: { en: "Medium", so: "Heer dhexe" },
  HIGH: { en: "High", so: "Heer sare" },
  VERIFIED: { en: "Verified", so: "La xaqiijiyay" },
};

export const EVIDENCE_LEVEL_COLORS: Record<EvidenceLevel, string> = {
  LOW: "border border-white/10 bg-white/5 text-red-200/70",
  MEDIUM: "border border-red-400/25 bg-red-950/30 text-red-200",
  HIGH: "border border-red-400/40 bg-red-950/40 text-red-100",
  VERIFIED: "border border-red-400/50 bg-red-600/25 text-red-50",
};

export const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const RISK_LEVEL_LABELS: Record<RiskLevel, { en: string; so: string }> = {
  LOW: { en: "Low Risk", so: "Khatar hoose" },
  MEDIUM: { en: "Medium Risk", so: "Khatar dhexe" },
  HIGH: { en: "High Risk", so: "Khatar sare" },
  CRITICAL: { en: "Critical Risk", so: "Khatar aad u sarreysa" },
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "border border-white/10 bg-white/5 text-red-200/70",
  MEDIUM: "border border-red-400/30 bg-red-950/35 text-red-200",
  HIGH: "border border-red-400/45 bg-red-950/45 text-red-100",
  CRITICAL: "border border-red-400/55 bg-red-600/30 text-red-50",
};

export const CATEGORY_BADGE_COLORS =
  "border border-red-400/30 bg-red-950/30 text-red-200";

export const WHAT_WENT_WRONG_BADGE_COLORS =
  "border border-red-400/40 bg-red-950/40 text-red-100";
