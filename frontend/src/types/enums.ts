export type WhatWentWrong =
  | "WRONG_MEDICATION"
  | "WRONG_DOSAGE"
  | "MISDIAGNOSIS"
  | "DELAYED_TREATMENT"
  | "NEGLIGENCE"
  | "OTHER";

export type CaseStatus = "DRAFT" | "UNDER_REVIEW" | "VERIFIED" | "PUBLISHED";

export type EvidenceLevel = "LOW" | "MEDIUM" | "HIGH" | "VERIFIED";

export type EvidenceType = "IMAGE" | "VIDEO" | "DOCUMENT";
