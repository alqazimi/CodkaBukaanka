import type { CaseStatus } from "@/types/entities";

export const CREATABLE_CASE_STATUSES: CaseStatus[] = ["DRAFT", "UNDER_REVIEW"];

const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  DRAFT: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["DRAFT", "VERIFIED"],
  VERIFIED: ["UNDER_REVIEW", "PUBLISHED"],
  PUBLISHED: ["VERIFIED"],
};

/** Status values selectable in the admin case form. */
export function getSelectableCaseStatuses(current?: CaseStatus, isNew = false): CaseStatus[] {
  if (isNew || !current) return CREATABLE_CASE_STATUSES;
  const next = TRANSITIONS[current] ?? [];
  return Array.from(new Set([current, ...next]));
}
