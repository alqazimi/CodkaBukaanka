export type WhatWentWrong =
  | "WRONG_MEDICATION"
  | "WRONG_DOSAGE"
  | "MISDIAGNOSIS"
  | "DELAYED_TREATMENT"
  | "NEGLIGENCE"
  | "OTHER";

export type CaseCategory =
  | "WRONG_MEDICATION"
  | "MEDICATION_ERROR"
  | "MISDIAGNOSIS"
  | "DELAYED_TREATMENT"
  | "MEDICAL_NEGLIGENCE"
  | "SURGICAL_ERROR"
  | "PATIENT_SAFETY_INCIDENT"
  | "HOSPITAL_COMPLAINT"
  | "OTHER";

export type CaseStatus = "DRAFT" | "UNDER_REVIEW" | "VERIFIED" | "PUBLISHED";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EvidenceLevel = "LOW" | "MEDIUM" | "HIGH" | "VERIFIED";

export type EvidenceType = "IMAGE" | "VIDEO" | "DOCUMENT";

export type EvidenceItem = {
  id: string;
  type: EvidenceType;
  url: string;
  visibility?: "PUBLIC" | "PRIVATE";
  description?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
};

export type CaseItem = {
  id: string;
  caseNumber: string;
  title: string;
  slug: string;
  reasonForVisit: string;
  incidentDescription: string;
  currentCondition?: string | null;
  whatWentWrong: WhatWentWrong;
  category: CaseCategory;
  status: CaseStatus;
  riskLevel: RiskLevel;
  evidenceLevel: EvidenceLevel;
  incidentDate: string;
  publishedAt?: string | null;
  createdAt: string;
  hospital: { name: string; slug: string; location?: string };
  patient: { fullName: string; slug: string };
  doctor?: { fullName: string; slug: string } | null;
  medication?: { name: string; slug: string } | null;
  evidence?: EvidenceItem[];
  /** @deprecated use patient */
  victim?: { fullName: string; slug: string };
};

export type HospitalItem = {
  id: string;
  name: string;
  slug: string;
  location: string;
  description?: string | null;
  _count?: { cases: number };
  totalCases?: number;
};

export type PatientItem = {
  id: string;
  fullName: string;
  slug: string;
  age?: number | null;
  gender?: string | null;
  _count?: { cases: number };
  totalCases?: number;
};

export type DoctorItem = {
  id: string;
  fullName: string;
  slug: string;
  specialty?: string | null;
  hospital?: { name: string; slug: string } | null;
  _count?: { cases: number };
  totalCases?: number;
};

export type MedicationItem = {
  id: string;
  name: string;
  slug: string;
  type?: string | null;
  _count?: { cases: number };
  totalCases?: number;
};

/** @deprecated use PatientItem */
export type VictimItem = PatientItem;
