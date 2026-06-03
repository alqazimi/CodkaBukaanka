import type { CaseStatus } from "@prisma/client";

const ALLOWED_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  DRAFT: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["DRAFT", "VERIFIED"],
  VERIFIED: ["UNDER_REVIEW", "PUBLISHED"],
  PUBLISHED: ["VERIFIED"],
};

const CREATABLE_STATUSES: CaseStatus[] = ["DRAFT", "UNDER_REVIEW"];

export class CaseWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CaseWorkflowError";
  }
}

export function isCreatableCaseStatus(status: CaseStatus): boolean {
  return CREATABLE_STATUSES.includes(status);
}

export function assertValidStatusTransition(from: CaseStatus, to: CaseStatus): void {
  if (from === to) return;
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new CaseWorkflowError(`Invalid status transition from ${from} to ${to}`);
  }
}

export function validateStatusTransition(from: CaseStatus, to: CaseStatus | undefined): void {
  if (!to || from === to) return;
  assertValidStatusTransition(from, to);
}
