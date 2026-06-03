import { prisma } from "./prisma.js";
import { PUBLIC_CASE_FILTER } from "./constants.js";
import type { RiskLevel } from "@prisma/client";

const HIGH_RISK_THRESHOLD = 2;
const CRITICAL_CLUSTER_MIN = 1;

export type HospitalRiskCluster = {
  hospitalId: string;
  hospitalName: string;
  slug: string;
  location: string;
  caseCount: number;
  criticalCount: number;
  highCount: number;
  riskScore: number;
  categories: string[];
};

export type MedicationRiskPattern = {
  medicationId: string;
  name: string;
  slug: string;
  caseCount: number;
  highOrCriticalCount: number;
  hospitals: string[];
};

export type DoctorRiskPattern = {
  doctorId: string;
  fullName: string;
  slug: string;
  caseCount: number;
  hospitals: string[];
};

export type RiskAnalysisReport = {
  generatedAt: string;
  summary: {
    totalPublicCases: number;
    criticalCases: number;
    highRiskCases: number;
    highRiskHospitals: number;
  };
  hospitalClusters: HospitalRiskCluster[];
  medicationPatterns: MedicationRiskPattern[];
  doctorPatterns: DoctorRiskPattern[];
  criticalCases: {
    id: string;
    caseNumber: string;
    title: string;
    slug: string;
    riskLevel: RiskLevel;
    hospital: string;
    incidentDate: Date;
  }[];
};

function riskScore(caseCount: number, critical: number, high: number): number {
  return caseCount * 10 + critical * 50 + high * 25;
}

export async function runRiskAnalysis(): Promise<RiskAnalysisReport> {
  const [cases, hospitalGroups, medicationGroups, doctorGroups] = await Promise.all([
    prisma.case.findMany({
      where: PUBLIC_CASE_FILTER,
      select: {
        id: true,
        caseNumber: true,
        title: true,
        slug: true,
        riskLevel: true,
        category: true,
        incidentDate: true,
        hospitalId: true,
        hospital: { select: { name: true, slug: true, location: true } },
        medicationId: true,
        medication: { select: { name: true, slug: true } },
        doctorId: true,
        doctor: { select: { fullName: true, slug: true } },
      },
    }),
    prisma.case.groupBy({
      by: ["hospitalId"],
      where: PUBLIC_CASE_FILTER,
      _count: true,
    }),
    prisma.case.groupBy({
      by: ["medicationId"],
      where: { ...PUBLIC_CASE_FILTER, medicationId: { not: null } },
      _count: true,
    }),
    prisma.case.groupBy({
      by: ["doctorId"],
      where: { ...PUBLIC_CASE_FILTER, doctorId: { not: null } },
      _count: true,
    }),
  ]);

  const hospitalMap = new Map<string, HospitalRiskCluster>();

  for (const c of cases) {
    const h = c.hospital;
    const existing = hospitalMap.get(c.hospitalId) ?? {
      hospitalId: c.hospitalId,
      hospitalName: h.name,
      slug: h.slug,
      location: h.location,
      caseCount: 0,
      criticalCount: 0,
      highCount: 0,
      riskScore: 0,
      categories: [] as string[],
    };
    existing.caseCount++;
    if (c.riskLevel === "CRITICAL") existing.criticalCount++;
    if (c.riskLevel === "HIGH") existing.highCount++;
    if (!existing.categories.includes(c.category)) existing.categories.push(c.category);
    hospitalMap.set(c.hospitalId, existing);
  }

  const hospitalClusters = [...hospitalMap.values()]
    .map((h) => ({
      ...h,
      riskScore: riskScore(h.caseCount, h.criticalCount, h.highCount),
    }))
    .filter((h) => h.caseCount >= HIGH_RISK_THRESHOLD || h.criticalCount >= CRITICAL_CLUSTER_MIN)
    .sort((a, b) => b.riskScore - a.riskScore);

  const medicationPatterns: MedicationRiskPattern[] = [];
  for (const g of medicationGroups) {
    if (!g.medicationId) continue;
    const medCases = cases.filter((c) => c.medicationId === g.medicationId);
    const med = medCases[0]?.medication;
    if (!med) continue;
    medicationPatterns.push({
      medicationId: g.medicationId,
      name: med.name,
      slug: med.slug,
      caseCount: g._count,
      highOrCriticalCount: medCases.filter((c) => c.riskLevel === "HIGH" || c.riskLevel === "CRITICAL").length,
      hospitals: [...new Set(medCases.map((c) => c.hospital.name))],
    });
  }
  medicationPatterns.sort((a, b) => b.caseCount - a.caseCount);

  const doctorPatterns: DoctorRiskPattern[] = [];
  for (const g of doctorGroups) {
    if (!g.doctorId) continue;
    const docCases = cases.filter((c) => c.doctorId === g.doctorId);
    const doc = docCases[0]?.doctor;
    if (!doc) continue;
    doctorPatterns.push({
      doctorId: g.doctorId,
      fullName: doc.fullName,
      slug: doc.slug,
      caseCount: g._count,
      hospitals: [...new Set(docCases.map((c) => c.hospital.name))],
    });
  }
  doctorPatterns.sort((a, b) => b.caseCount - a.caseCount);

  const criticalCases = cases
    .filter((c) => c.riskLevel === "CRITICAL" || c.riskLevel === "HIGH")
    .sort((a, b) => {
      const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return order[a.riskLevel] - order[b.riskLevel];
    })
    .map((c) => ({
      id: c.id,
      caseNumber: c.caseNumber,
      title: c.title,
      slug: c.slug,
      riskLevel: c.riskLevel,
      hospital: c.hospital.name,
      incidentDate: c.incidentDate,
    }));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPublicCases: cases.length,
      criticalCases: cases.filter((c) => c.riskLevel === "CRITICAL").length,
      highRiskCases: cases.filter((c) => c.riskLevel === "HIGH").length,
      highRiskHospitals: hospitalClusters.length,
    },
    hospitalClusters,
    medicationPatterns: medicationPatterns.filter((m) => m.caseCount >= 1),
    doctorPatterns: doctorPatterns.filter((d) => d.caseCount >= 2),
    criticalCases,
  };
}

export async function getAdminAnalytics() {
  const [byHospital, byCategory, byRiskLevel, byMedication, totalCases, draftCases, totalHospitals, totalPatients, totalDoctors, totalMedications] =
    await Promise.all([
      prisma.case.groupBy({
        by: ["hospitalId"],
        where: PUBLIC_CASE_FILTER,
        _count: true,
        orderBy: { _count: { hospitalId: "desc" } },
      }),
      prisma.case.groupBy({
        by: ["category"],
        where: PUBLIC_CASE_FILTER,
        _count: true,
      }),
      prisma.case.groupBy({
        by: ["riskLevel"],
        _count: true,
      }),
      prisma.case.groupBy({
        by: ["medicationId"],
        where: { ...PUBLIC_CASE_FILTER, medicationId: { not: null } },
        _count: true,
        orderBy: { _count: { medicationId: "desc" } },
        take: 10,
      }),
      prisma.case.count(),
      prisma.case.count({ where: { status: { in: ["DRAFT", "UNDER_REVIEW"] } } }),
      prisma.hospital.count(),
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.medication.count(),
    ]);

  const hospitalIds = byHospital.map((h) => h.hospitalId);
  const hospitals = await prisma.hospital.findMany({
    where: { id: { in: hospitalIds } },
    select: { id: true, name: true, slug: true, location: true },
  });
  const hospitalMap = new Map(hospitals.map((h) => [h.id, h]));

  const medIds = byMedication.map((m) => m.medicationId).filter(Boolean) as string[];
  const medications = await prisma.medication.findMany({
    where: { id: { in: medIds } },
    select: { id: true, name: true, slug: true },
  });
  const medMap = new Map(medications.map((m) => [m.id, m]));

  const riskAnalysis = await runRiskAnalysis();

  const [unreadInbox, underReviewCases, verifiedCases, casesMissingPublicEvidence] = await Promise.all([
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.case.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.case.count({ where: { status: "VERIFIED" } }),
    prisma.case.count({
      where: {
        status: { in: ["VERIFIED", "PUBLISHED"] },
        evidence: { none: { visibility: "PUBLIC" } },
      },
    }),
  ]);

  return {
    totalCases,
    draftCases,
    publishedCases: totalCases - draftCases,
    totalHospitals,
    totalPatients,
    totalDoctors,
    totalMedications,
    unreadInbox,
    underReviewCases,
    verifiedCases,
    casesMissingPublicEvidence,
    casesByHospital: byHospital.map((h) => ({
      hospital: hospitalMap.get(h.hospitalId),
      count: h._count,
    })),
    casesByCategory: byCategory,
    casesByRiskLevel: byRiskLevel,
    trendingMedications: byMedication.map((m) => ({
      medication: m.medicationId ? medMap.get(m.medicationId) : null,
      count: m._count,
    })),
    riskAnalysis,
  };
}
