import type { Prisma } from "@prisma/client";
import { PUBLIC_CASE_FILTER } from "./constants.js";

/**
 * Merge user filters into a public-safe Case where clause.
 * Always enforces PUBLIC_CASE_FILTER (PUBLISHED only).
 */
export function buildPublicCaseWhere(
  filters: {
    hospital?: string;
    patient?: string;
    category?: string;
    riskLevel?: string;
    dateFrom?: string;
    dateTo?: string;
    q?: string;
  },
  textOr?: Prisma.CaseWhereInput[]
): Prisma.CaseWhereInput {
  const where: Prisma.CaseWhereInput = { ...PUBLIC_CASE_FILTER };

  if (filters.category) {
    where.category = filters.category as Prisma.EnumCaseCategoryFilter["equals"];
  }
  if (filters.riskLevel) {
    where.riskLevel = filters.riskLevel as Prisma.EnumRiskLevelFilter["equals"];
  }
  if (filters.hospital) where.hospital = { slug: filters.hospital };
  if (filters.patient) where.patient = { slug: filters.patient };

  if (filters.dateFrom || filters.dateTo) {
    where.incidentDate = {};
    if (filters.dateFrom) where.incidentDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.incidentDate.lte = new Date(filters.dateTo);
  }

  if (textOr?.length) {
    where.AND = [{ OR: textOr }];
  }

  return where;
}
