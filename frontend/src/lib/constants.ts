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
  WRONG_MEDICATION: { en: "Wrong Medication", so: "Daawo Khaldan" },
  WRONG_DOSAGE: { en: "Wrong Dosage", so: "Qiyaas Khaldan" },
  MISDIAGNOSIS: { en: "Misdiagnosis", so: "Cudur-qorid Khaldan" },
  DELAYED_TREATMENT: { en: "Delayed Treatment", so: "Daahitaan Daaweyn" },
  NEGLIGENCE: { en: "Negligence", so: "Dayac" },
  OTHER: { en: "Other", so: "Kale" },
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
  WRONG_MEDICATION: { en: "Wrong Medication", so: "Daawo Khaldan" },
  MEDICATION_ERROR: { en: "Medication Error", so: "Khalad Daawo" },
  MISDIAGNOSIS: { en: "Misdiagnosis", so: "Cudur-qorid Khaldan" },
  DELAYED_TREATMENT: { en: "Delayed Treatment", so: "Daahitaan Daaweyn" },
  MEDICAL_NEGLIGENCE: { en: "Medical Negligence", so: "Dayac Caafimaad" },
  SURGICAL_ERROR: { en: "Surgical Error", so: "Khalad Qalliin" },
  PATIENT_SAFETY_INCIDENT: { en: "Patient Safety Incident", so: "Dhacdo Badbaado Bukaan" },
  HOSPITAL_COMPLAINT: { en: "Hospital Complaint", so: "Cabasho Isbitaal" },
  OTHER: { en: "Other", so: "Kale" },
};

export const STATUS_LABELS: Record<CaseStatus, { en: string; so: string }> = {
  DRAFT: { en: "Draft", so: "Qoraal" },
  UNDER_REVIEW: { en: "Under Review", so: "Waa la eegayaa" },
  VERIFIED: { en: "Verified", so: "La xaqiijiyay" },
  PUBLISHED: { en: "Published", so: "La daabacay" },
};

export const STATUS_COLORS: Record<CaseStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  UNDER_REVIEW: "bg-amber-100 text-amber-800 border-amber-200",
  VERIFIED: "bg-teal-100 text-teal-800 border-teal-200",
  PUBLISHED: "bg-green-100 text-green-800 border-green-200",
};

export const EVIDENCE_LEVEL_LABELS: Record<EvidenceLevel, { en: string; so: string }> = {
  LOW: { en: "Low", so: "Hoose" },
  MEDIUM: { en: "Medium", so: "Dhexe" },
  HIGH: { en: "High", so: "Sare" },
  VERIFIED: { en: "Verified", so: "La xaqiijiyay" },
};

export const EVIDENCE_LEVEL_COLORS: Record<EvidenceLevel, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-200",
  HIGH: "bg-blue-100 text-blue-800 border-blue-200",
  VERIFIED: "bg-green-100 text-green-800 border-green-200",
};

export const RISK_LEVELS: RiskLevel[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const RISK_LEVEL_LABELS: Record<RiskLevel, { en: string; so: string }> = {
  LOW: { en: "Low Risk", so: "Khatar Hoose" },
  MEDIUM: { en: "Medium Risk", so: "Khatar Dhexe" },
  HIGH: { en: "High Risk", so: "Khatar Sare" },
  CRITICAL: { en: "Critical Risk", so: "Khatar Daran" },
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  LOW: "bg-slate-50 text-slate-700 border-slate-200",
  MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
  HIGH: "bg-orange-50 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-50 text-red-800 border-red-200",
};
