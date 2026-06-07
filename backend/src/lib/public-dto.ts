import type { Prisma } from "@prisma/client";

/** Explicit allowlist — never return raw Prisma Case models on public APIs. */
export const PUBLIC_CASE_SELECT = {
  id: true,
  caseNumber: true,
  title: true,
  slug: true,
  category: true,
  riskLevel: true,
  whatWentWrong: true,
  reasonForVisit: true,
  incidentDescription: true,
  currentCondition: true,
  status: true,
  incidentDate: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.CaseSelect;

export const PUBLIC_HOSPITAL_SELECT = {
  id: true,
  name: true,
  slug: true,
  location: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.HospitalSelect;

export const PUBLIC_PATIENT_SELECT = {
  id: true,
  fullName: true,
  slug: true,
  age: true,
  gender: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.PatientSelect;

export const PUBLIC_DOCTOR_SELECT = {
  id: true,
  fullName: true,
  slug: true,
  specialty: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.DoctorSelect;

export const PUBLIC_MEDICATION_SELECT = {
  id: true,
  name: true,
  slug: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.MedicationSelect;

export const PUBLIC_EVIDENCE_SELECT = {
  id: true,
  type: true,
  url: true,
  description: true,
  fileName: true,
  mimeType: true,
  visibility: true,
  createdAt: true,
} as const satisfies Prisma.EvidenceSelect;

export const PUBLIC_CASE_INCLUDE = {
  hospital: { select: { name: true, slug: true, location: true } },
  patient: { select: { fullName: true, slug: true, age: true, gender: true } },
  doctor: { select: { fullName: true, slug: true, specialty: true } },
  medication: { select: { name: true, slug: true, type: true } },
} as const;

export const PUBLIC_CASE_CARD_INCLUDE = {
  hospital: { select: { name: true, slug: true } },
  patient: { select: { fullName: true, slug: true } },
  doctor: { select: { fullName: true, slug: true } },
  medication: { select: { name: true, slug: true } },
} as const;

export type PublicCaseDto = Prisma.CaseGetPayload<{ select: typeof PUBLIC_CASE_SELECT }>;
export type PublicCaseWithRelations = Prisma.CaseGetPayload<{
  select: typeof PUBLIC_CASE_SELECT;
  include: typeof PUBLIC_CASE_INCLUDE;
}>;

export function toPublicCase<T extends Record<string, unknown>>(record: T): Omit<T, "internalNotes" | "authorId" | "deletedAt" | "deletedById" | "hospitalId" | "patientId" | "doctorId" | "medicationId"> {
  const {
    internalNotes: _n,
    authorId: _a,
    deletedAt: _d,
    deletedById: _db,
    hospitalId: _h,
    patientId: _p,
    doctorId: _doc,
    medicationId: _m,
    ...safe
  } = record as T & {
    internalNotes?: unknown;
    authorId?: unknown;
    deletedAt?: unknown;
    deletedById?: unknown;
    hospitalId?: unknown;
    patientId?: unknown;
    doctorId?: unknown;
    medicationId?: unknown;
  };
  void _n;
  void _a;
  void _d;
  void _db;
  void _h;
  void _p;
  void _doc;
  void _m;
  return safe;
}

export function toPublicPatientProfile(patient: {
  id: string;
  fullName: string;
  slug: string;
  age: number | null;
  gender: string | null;
  createdAt: Date;
  updatedAt: Date;
  cases: Array<Record<string, unknown> & { hospital: unknown; doctor: unknown | null; medication: unknown | null }>;
}) {
  const hospitals = [...new Map(patient.cases.map((c) => [(c.hospital as { slug: string }).slug, c.hospital])).values()];
  const cases = patient.cases.map((c) => toPublicCase(c));
  return {
    id: patient.id,
    fullName: patient.fullName,
    slug: patient.slug,
    age: patient.age,
    gender: patient.gender,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    totalCases: patient.cases.length,
    hospitals,
    timeline: cases,
    cases,
  };
}

export function toPublicMedicationProfile(medication: {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
  cases: Array<Record<string, unknown> & { hospital: unknown; patient: unknown }>;
}) {
  const hospitals = [...new Map(medication.cases.map((c) => [(c.hospital as { slug: string }).slug, c.hospital])).values()];
  const patients = [...new Map(medication.cases.map((c) => [(c.patient as { slug: string }).slug, c.patient])).values()];
  return {
    id: medication.id,
    name: medication.name,
    slug: medication.slug,
    type: medication.type,
    createdAt: medication.createdAt,
    updatedAt: medication.updatedAt,
    totalCases: medication.cases.length,
    hospitals,
    patients,
    cases: medication.cases.map((c) => toPublicCase(c)),
  };
}

export function toPublicDoctorProfile(doctor: Record<string, unknown> & { cases: Array<Record<string, unknown>> }) {
  const { cases, ...rest } = doctor;
  return {
    ...rest,
    totalCases: cases.length,
    cases: cases.map((c) => toPublicCase(c)),
  };
}
