import { prisma } from "./prisma.js";
import { PUBLIC_CASE_FILTER } from "./constants.js";
import { buildPublicCaseWhere } from "./public-filter.js";
import { parsePagination, paginationMeta } from "./pagination.js";
import type { CaseCategory, RiskLevel } from "@prisma/client";

const SEARCH_LIMIT_MAX = 20;

function fuzzyWords(term: string): string[] {
  return term.trim().split(/\s+/).filter((w) => w.length > 0);
}

function buildTextOr(words: string[], fields: string[]): object[] {
  const conditions: object[] = [];
  for (const word of words) {
    for (const field of fields) {
      conditions.push({ [field]: { contains: word, mode: "insensitive" as const } });
    }
  }
  return conditions;
}

/** Relevance score for ranking search results (higher = better match) */
export function scoreRelevance(
  text: string,
  query: string,
  words: string[]
): number {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let score = 0;
  if (lower === q) score += 100;
  else if (lower.startsWith(q)) score += 80;
  else if (lower.includes(q)) score += 50;
  for (const w of words) {
    if (w.length < 2) continue;
    if (lower.includes(w.toLowerCase())) score += 15;
    // Partial / typo-tolerant: first 3 chars match
    if (w.length >= 3 && lower.includes(w.slice(0, 3).toLowerCase())) score += 5;
  }
  return score;
}

export type SearchFilters = {
  q?: string;
  hospital?: string;
  patient?: string;
  category?: CaseCategory;
  riskLevel?: RiskLevel;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

const caseInclude = {
  hospital: { select: { name: true, slug: true, location: true } },
  patient: { select: { fullName: true, slug: true } },
  doctor: { select: { fullName: true, slug: true } },
  medication: { select: { name: true, slug: true } },
} as const;

export async function globalSearch(q: string, limit = 8) {
  const safeLimit = Math.min(SEARCH_LIMIT_MAX, Math.max(1, limit));
  const words = fuzzyWords(q);
  if (!words.length) {
    return { hospitals: [], patients: [], doctors: [], medications: [], cases: [] };
  }

  const fullTerm = q.trim();

  const [hospitals, patients, doctors, medications, casesRaw] = await Promise.all([
    prisma.hospital.findMany({
      where: {
        OR: [
          { name: { contains: fullTerm, mode: "insensitive" } },
          { location: { contains: fullTerm, mode: "insensitive" } },
          ...buildTextOr(words, ["name", "location"]),
        ],
      },
      take: safeLimit * 2,
      include: { _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } } },
    }),
    prisma.patient.findMany({
      where: {
        OR: [
          { fullName: { contains: fullTerm, mode: "insensitive" } },
          ...buildTextOr(words, ["fullName"]),
        ],
        cases: { some: PUBLIC_CASE_FILTER },
      },
      take: safeLimit * 2,
      include: { _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } } },
    }),
    prisma.doctor.findMany({
      where: {
        OR: [
          { fullName: { contains: fullTerm, mode: "insensitive" } },
          { specialty: { contains: fullTerm, mode: "insensitive" } },
          ...buildTextOr(words, ["fullName", "specialty"]),
        ],
        cases: { some: PUBLIC_CASE_FILTER },
      },
      take: safeLimit * 2,
      include: {
        hospital: { select: { name: true, slug: true } },
        _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } },
      },
    }),
    prisma.medication.findMany({
      where: {
        OR: [
          { name: { contains: fullTerm, mode: "insensitive" } },
          { type: { contains: fullTerm, mode: "insensitive" } },
          ...buildTextOr(words, ["name", "type"]),
        ],
        cases: { some: PUBLIC_CASE_FILTER },
      },
      take: safeLimit * 2,
      include: { _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } } },
    }),
    prisma.case.findMany({
      where: buildPublicCaseWhere(
        {},
        [
          { title: { contains: fullTerm, mode: "insensitive" } },
          { caseNumber: { contains: fullTerm, mode: "insensitive" } },
          { reasonForVisit: { contains: fullTerm, mode: "insensitive" } },
          { incidentDescription: { contains: fullTerm, mode: "insensitive" } },
          { currentCondition: { contains: fullTerm, mode: "insensitive" } },
          ...buildTextOr(words, ["title", "caseNumber", "reasonForVisit", "incidentDescription"]),
          { hospital: { name: { contains: fullTerm, mode: "insensitive" } } },
          { patient: { fullName: { contains: fullTerm, mode: "insensitive" } } },
          { doctor: { fullName: { contains: fullTerm, mode: "insensitive" } } },
          { medication: { name: { contains: fullTerm, mode: "insensitive" } } },
        ]
      ),
      take: safeLimit * 3,
      orderBy: [{ riskLevel: "desc" }, { incidentDate: "desc" }],
      include: caseInclude,
    }),
  ]);

  const hospitalsRanked = hospitals
    .map((h) => ({ item: h, score: scoreRelevance(`${h.name} ${h.location}`, fullTerm, words) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((r) => r.item);

  const patientsRanked = patients
    .map((p) => ({ item: p, score: scoreRelevance(p.fullName, fullTerm, words) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((r) => r.item);

  const doctorsRanked = doctors
    .map((d) => ({
      item: d,
      score: scoreRelevance(`${d.fullName} ${d.specialty ?? ""}`, fullTerm, words),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((r) => r.item);

  const medicationsRanked = medications
    .map((m) => ({
      item: m,
      score: scoreRelevance(`${m.name} ${m.type ?? ""}`, fullTerm, words),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((r) => r.item);

  const casesRanked = casesRaw
    .map((c) => ({
      item: c,
      score: scoreRelevance(
        `${c.title} ${c.caseNumber} ${c.incidentDescription}`,
        fullTerm,
        words
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, safeLimit)
    .map((r) => r.item);

  return {
    hospitals: hospitalsRanked,
    patients: patientsRanked,
    doctors: doctorsRanked,
    medications: medicationsRanked,
    cases: casesRanked,
  };
}

export async function searchSuggestions(q: string) {
  if (q.trim().length < 2) return [];
  const { hospitals, patients, doctors, medications, cases } = await globalSearch(q, 5);
  return [
    ...hospitals.map((h) => ({
      type: "hospital" as const,
      id: h.id,
      label: h.name,
      slug: h.slug,
      meta: h.location,
    })),
    ...patients.map((p) => ({
      type: "patient" as const,
      id: p.id,
      label: p.fullName,
      slug: p.slug,
      meta: `${p._count.cases} cases`,
    })),
    ...doctors.map((d) => ({
      type: "doctor" as const,
      id: d.id,
      label: d.fullName,
      slug: d.slug,
      meta: d.specialty ?? d.hospital?.name ?? "",
    })),
    ...medications.map((m) => ({
      type: "medication" as const,
      id: m.id,
      label: m.name,
      slug: m.slug,
      meta: `${m._count.cases} cases`,
    })),
    ...cases.map((c) => ({
      type: "case" as const,
      id: c.id,
      label: c.title,
      slug: c.slug,
      meta: c.caseNumber,
    })),
  ].slice(0, 12);
}

export async function searchCases(filters: SearchFilters) {
  const { page, limit, skip } = parsePagination(filters);

  const term = filters.q?.trim();
  const words = term ? fuzzyWords(term) : [];

  const textOr = term
    ? [
        { title: { contains: term, mode: "insensitive" as const } },
        { caseNumber: { contains: term, mode: "insensitive" as const } },
        { reasonForVisit: { contains: term, mode: "insensitive" as const } },
        { incidentDescription: { contains: term, mode: "insensitive" as const } },
        { hospital: { name: { contains: term, mode: "insensitive" as const } } },
        { patient: { fullName: { contains: term, mode: "insensitive" as const } } },
        { doctor: { fullName: { contains: term, mode: "insensitive" as const } } },
        { medication: { name: { contains: term, mode: "insensitive" as const } } },
        ...buildTextOr(words, ["title", "caseNumber", "incidentDescription"]),
      ]
    : undefined;

  const where = buildPublicCaseWhere(
    {
      hospital: filters.hospital,
      patient: filters.patient,
      category: filters.category,
      riskLevel: filters.riskLevel,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
    textOr
  );

  const [cases, total] = await Promise.all([
    prisma.case.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ riskLevel: "desc" }, { incidentDate: "desc" }],
      include: caseInclude,
    }),
    prisma.case.count({ where }),
  ]);

  return { cases, ...paginationMeta(total, page, limit) };
}

export async function getPublicStats() {
  const [totalCases, totalHospitals, totalPatients, totalDoctors, totalMedications, byCategory, byRiskLevel] =
    await Promise.all([
      prisma.case.count({ where: PUBLIC_CASE_FILTER }),
      prisma.hospital.count(),
      prisma.patient.count({ where: { cases: { some: PUBLIC_CASE_FILTER } } }),
      prisma.doctor.count({ where: { cases: { some: PUBLIC_CASE_FILTER } } }),
      prisma.medication.count({ where: { cases: { some: PUBLIC_CASE_FILTER } } }),
      prisma.case.groupBy({
        by: ["category"],
        where: PUBLIC_CASE_FILTER,
        _count: true,
      }),
      prisma.case.groupBy({
        by: ["riskLevel"],
        where: PUBLIC_CASE_FILTER,
        _count: true,
      }),
    ]);
  return {
    totalCases,
    totalHospitals,
    totalPatients,
    totalDoctors,
    totalMedications,
    byCategory,
    byRiskLevel,
  };
}

export async function getMedicationProfile(slug: string) {
  const medication = await prisma.medication.findUnique({
    where: { slug },
    include: {
      cases: {
        where: PUBLIC_CASE_FILTER,
        orderBy: { incidentDate: "desc" },
        include: {
          hospital: { select: { name: true, slug: true, location: true } },
          patient: { select: { fullName: true, slug: true } },
        },
      },
    },
  });
  if (!medication) return null;

  const hospitals = [...new Map(medication.cases.map((c) => [c.hospital.slug, c.hospital])).values()];
  const patients = [...new Map(medication.cases.map((c) => [c.patient.slug, c.patient])).values()];

  return {
    ...medication,
    totalCases: medication.cases.length,
    hospitals,
    patients,
  };
}
