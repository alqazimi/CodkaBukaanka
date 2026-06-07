import type { CaseSubmission, CaseSubmissionEvidence } from "@prisma/client";
import { prisma } from "./prisma.js";
import { slugify } from "./utils.js";
import { logAudit } from "./audit.js";
import { assertSafeEvidenceUrl } from "./safe-url.js";
import { NOT_DELETED } from "./soft-delete.js";

export function normalizeEntityName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function namesMatch(a: string, b: string): boolean {
  const left = normalizeEntityName(a);
  const right = normalizeEntityName(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function submissionInternalNotes(submission: CaseSubmission): string | null {
  const lines = [
    `From public submission (${submission.createdAt.toISOString().slice(0, 10)})`,
    `Submitter: ${submission.submitterName} <${submission.submitterEmail}>${
      submission.submitterPhone ? ` · ${submission.submitterPhone}` : ""
    }`,
  ];
  const notes = submission.evidenceNotes?.trim();
  if (notes) lines.push(`Evidence notes: ${notes}`);
  return lines.join("\n");
}

async function findHospitalByName(name: string) {
  const hospitals = await prisma.hospital.findMany({
    where: NOT_DELETED,
    select: { id: true, name: true, location: true },
  });
  return hospitals.find((hospital) => namesMatch(hospital.name, name)) ?? null;
}

async function findOrCreateHospital(
  name: string,
  location: string | null | undefined,
  adminId: string
): Promise<{ id: string; name: string; location: string; created: boolean }> {
  const trimmedName = name.trim();
  const existing = await findHospitalByName(trimmedName);
  if (existing) {
    return { ...existing, location: existing.location, created: false };
  }

  const resolvedLocation = (location?.trim() || "Unspecified").slice(0, 200);
  try {
    const hospital = await prisma.hospital.create({
      data: {
        name: trimmedName,
        location: resolvedLocation,
        slug: slugify(trimmedName),
      },
      select: { id: true, name: true, location: true },
    });
    await logAudit({
      adminId,
      action: "CREATE",
      entityType: "hospital",
      entityId: hospital.id,
      details: JSON.stringify({ source: "case_submission_prefill" }),
    });
    return { ...hospital, created: true };
  } catch {
    const retry = await findHospitalByName(trimmedName);
    if (retry) return { ...retry, location: retry.location, created: false };
    throw new Error("Could not resolve hospital for submission");
  }
}

async function findPatientByName(name: string) {
  const patients = await prisma.patient.findMany({
    where: NOT_DELETED,
    select: { id: true, fullName: true, age: true, gender: true },
  });
  return patients.find((patient) => namesMatch(patient.fullName, name)) ?? null;
}

async function findOrCreatePatient(
  name: string,
  age: number | null | undefined,
  gender: string | null | undefined,
  adminId: string
): Promise<{ id: string; fullName: string; age: number | null; created: boolean }> {
  const trimmedName = name.trim();
  const existing = await findPatientByName(trimmedName);
  if (existing) {
    return { id: existing.id, fullName: existing.fullName, age: existing.age, created: false };
  }

  try {
    const patient = await prisma.patient.create({
      data: {
        fullName: trimmedName,
        slug: slugify(trimmedName),
        age: age ?? undefined,
        gender: gender ?? undefined,
      },
      select: { id: true, fullName: true, age: true },
    });
    await logAudit({
      adminId,
      action: "CREATE",
      entityType: "patient",
      entityId: patient.id,
      details: JSON.stringify({ source: "case_submission_prefill" }),
    });
    return { ...patient, created: true };
  } catch {
    const retry = await findPatientByName(trimmedName);
    if (retry) {
      return { id: retry.id, fullName: retry.fullName, age: retry.age, created: false };
    }
    throw new Error("Could not resolve patient for submission");
  }
}

async function resolveDoctorId(name: string | null | undefined, hospitalId: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const doctors = await prisma.doctor.findMany({
    where: NOT_DELETED,
    select: { id: true, fullName: true, hospitalId: true },
  });
  const matches = doctors.filter((doctor) => namesMatch(doctor.fullName, trimmed));
  if (matches.length === 0) return null;
  if (hospitalId) {
    const atHospital = matches.find((doctor) => doctor.hospitalId === hospitalId);
    if (atHospital) return atHospital.id;
  }
  return matches[0]?.id ?? null;
}

async function resolveMedicationId(name: string | null | undefined) {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const medications = await prisma.medication.findMany({
    where: NOT_DELETED,
    select: { id: true, name: true },
  });
  const match = medications.find((medication) => namesMatch(medication.name, trimmed));
  return match?.id ?? null;
}

export type SubmissionCasePrefill = {
  submissionId: string;
  initial: Record<string, unknown>;
  extraHospitals: Array<{ id: string; name: string; location: string }>;
  extraPatients: Array<{ id: string; fullName: string; age?: number | null }>;
  submitter: { name: string; email: string; phone?: string | null };
  evidenceCount: number;
};

export async function buildCasePrefillFromSubmission(
  submission: CaseSubmission & { evidence: CaseSubmissionEvidence[] },
  adminId: string
): Promise<SubmissionCasePrefill> {
  const hospital = await findOrCreateHospital(
    submission.hospitalName,
    submission.hospitalLocation,
    adminId
  );
  const patient = await findOrCreatePatient(
    submission.patientName,
    submission.patientAge,
    submission.patientGender,
    adminId
  );
  const doctorId = await resolveDoctorId(submission.doctorName, hospital.id);
  const medicationId = await resolveMedicationId(submission.medicationName);

  const evidenceCount = submission.evidence.length;
  const incidentDate =
    submission.incidentDate instanceof Date
      ? submission.incidentDate.toISOString().slice(0, 10)
      : String(submission.incidentDate).slice(0, 10);

  return {
    submissionId: submission.id,
    initial: {
      title: submission.title,
      reasonForVisit: submission.reasonForVisit,
      incidentDescription: submission.incidentDescription,
      currentCondition: submission.currentCondition ?? "",
      internalNotes: submissionInternalNotes(submission),
      whatWentWrong: submission.whatWentWrong,
      category: submission.category,
      status: "DRAFT",
      riskLevel: "MEDIUM",
      evidenceLevel: evidenceCount > 0 ? "MEDIUM" : "LOW",
      incidentDate,
      hospitalId: hospital.id,
      patientId: patient.id,
      doctorId,
      medicationId,
    },
    extraHospitals: hospital.created ? [hospital] : [],
    extraPatients: patient.created ? [{ id: patient.id, fullName: patient.fullName, age: patient.age }] : [],
    submitter: {
      name: submission.submitterName,
      email: submission.submitterEmail,
      phone: submission.submitterPhone,
    },
    evidenceCount,
  };
}

export async function linkSubmissionToCase(
  submissionId: string,
  caseId: string,
  adminId: string
): Promise<{ evidenceCopied: number }> {
  const submission = await prisma.caseSubmission.findFirst({
    where: { id: submissionId, ...NOT_DELETED },
    include: { evidence: { orderBy: { createdAt: "asc" } } },
  });
  if (!submission) {
    throw new Error("Submission not found");
  }

  const linked = await prisma.case.findFirst({ where: { id: caseId, ...NOT_DELETED } });
  if (!linked) {
    throw new Error("Case not found");
  }

  let evidenceCopied = 0;
  for (const item of submission.evidence) {
    assertSafeEvidenceUrl(item.url);
    await prisma.evidence.create({
      data: {
        caseId,
        type: item.type,
        url: item.url,
        publicId: item.publicId,
        fileName: item.fileName,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        visibility: "PRIVATE",
        description: "Imported from public case submission",
      },
    });
    evidenceCopied += 1;
  }

  await prisma.caseSubmission.update({
    where: { id: submissionId },
    data: {
      linkedCaseId: caseId,
      status: submission.status === "NEW" ? "READ" : submission.status,
      readAt: submission.readAt ?? new Date(),
      readById: submission.readById ?? adminId,
    },
  });

  await logAudit({
    adminId,
    action: "UPDATE",
    entityType: "case_submission",
    entityId: submissionId,
    details: JSON.stringify({ linkedCaseId: caseId, evidenceCopied }),
  });

  return { evidenceCopied };
}
