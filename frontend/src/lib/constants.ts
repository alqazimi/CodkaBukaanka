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

export const STATUS_COLORS: Record<CaseStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/70 dark:text-gray-200 dark:border-gray-700",
  UNDER_REVIEW: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/60",
  VERIFIED: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800/60",
  PUBLISHED: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800/60",
};

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, { en: string; so: string }> = {
  LOW: { en: "Low", so: "Heer hoose" },
  MEDIUM: { en: "Medium", so: "Heer dhexe" },
  HIGH: { en: "High", so: "Heer sare" },
  VERIFIED: { en: "Verified", so: "La xaqiijiyay" },
};

export const EVIDENCE_LEVEL_COLORS: Record<EvidenceLevel, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/70 dark:text-gray-200 dark:border-gray-700",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/60",
  HIGH: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800/60",
  VERIFIED: "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800/60",
};

export const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const RISK_LEVEL_LABELS: Record<RiskLevel, { en: string; so: string }> = {
  LOW: { en: "Low Risk", so: "Khatar hoose" },
  MEDIUM: { en: "Medium Risk", so: "Khatar dhexe" },
  HIGH: { en: "High Risk", so: "Khatar sare" },
  CRITICAL: { en: "Critical Risk", so: "Khatar aad u sarreysa" },
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:border-slate-600",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-800/60",
  HIGH: "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800/60",
  CRITICAL: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800/60",
};

export const CATEGORY_BADGE_COLORS =
  "bg-navy-50 text-navy-700 border-navy-200 dark:bg-navy-800 dark:text-navy-200 dark:border-navy-700";

export const WHAT_WENT_WRONG_BADGE_COLORS =
  "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800/60";
