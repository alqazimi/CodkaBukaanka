import { prisma } from "./prisma.js";
import { slugify } from "./utils.js";
import type { Prisma } from "@prisma/client";

export const RECYCLE_BIN_ENTITY_TYPES = [
  "case",
  "hospital",
  "patient",
  "doctor",
  "medication",
  "evidence",
  "contact_message",
] as const;

export type RecycleBinEntityType = (typeof RECYCLE_BIN_ENTITY_TYPES)[number];

export const NOT_DELETED = { deletedAt: null } as const;

export type RecycleBinItem = {
  id: string;
  entityType: RecycleBinEntityType;
  label: string;
  deletedAt: Date;
  deletedById: string | null;
  deletedByName: string | null;
  meta?: string;
};

function trashSlug(original: string, id: string): string {
  return `${original}__deleted__${id.slice(0, 8)}`;
}

async function resolveDeletedByName(deletedById: string | null): Promise<string | null> {
  if (!deletedById) return null;
  const admin = await prisma.admin.findUnique({
    where: { id: deletedById },
    select: { name: true },
  });
  return admin?.name ?? null;
}

export async function softDeleteCase(id: string, adminId: string): Promise<void> {
  const existing = await prisma.case.findFirst({ where: { id, ...NOT_DELETED } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.$transaction([
    prisma.evidence.updateMany({
      where: { caseId: id, ...NOT_DELETED },
      data: { deletedAt: new Date(), deletedById: adminId },
    }),
    prisma.case.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: adminId,
        slug: trashSlug(existing.slug, id),
        caseNumber: trashSlug(existing.caseNumber, id),
      },
    }),
  ]);
}

export async function softDeleteHospital(id: string, adminId: string): Promise<void> {
  const existing = await prisma.hospital.findFirst({ where: { id, ...NOT_DELETED } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.hospital.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedById: adminId,
      slug: trashSlug(existing.slug, id),
      name: `${existing.name} (deleted)`,
    },
  });
}

export async function softDeletePatient(id: string, adminId: string): Promise<void> {
  const existing = await prisma.patient.findFirst({ where: { id, ...NOT_DELETED } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.patient.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedById: adminId,
      slug: trashSlug(existing.slug, id),
    },
  });
}

export async function softDeleteDoctor(id: string, adminId: string): Promise<void> {
  const existing = await prisma.doctor.findFirst({ where: { id, ...NOT_DELETED } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.doctor.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedById: adminId,
      slug: trashSlug(existing.slug, id),
    },
  });
}

export async function softDeleteMedication(id: string, adminId: string): Promise<void> {
  const existing = await prisma.medication.findFirst({ where: { id, ...NOT_DELETED } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.medication.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedById: adminId,
      slug: trashSlug(existing.slug, id),
    },
  });
}

export async function softDeleteEvidence(id: string, adminId: string): Promise<void> {
  const existing = await prisma.evidence.findFirst({ where: { id, ...NOT_DELETED } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.evidence.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: adminId },
  });
}

export async function softDeleteContactMessage(id: string, adminId: string): Promise<void> {
  const existing = await prisma.contactMessage.findFirst({ where: { id, ...NOT_DELETED } });
  if (!existing) throw new Error("NOT_FOUND");

  await prisma.contactMessage.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: adminId },
  });
}

export async function softDeleteEntity(
  entityType: RecycleBinEntityType,
  id: string,
  adminId: string
): Promise<void> {
  switch (entityType) {
    case "case":
      await softDeleteCase(id, adminId);
      break;
    case "hospital":
      await softDeleteHospital(id, adminId);
      break;
    case "patient":
      await softDeletePatient(id, adminId);
      break;
    case "doctor":
      await softDeleteDoctor(id, adminId);
      break;
    case "medication":
      await softDeleteMedication(id, adminId);
      break;
    case "evidence":
      await softDeleteEvidence(id, adminId);
      break;
    case "contact_message":
      await softDeleteContactMessage(id, adminId);
      break;
    default:
      throw new Error("INVALID_ENTITY");
  }
}

function stripDeletedSuffix(value: string): string {
  return value.replace(/__deleted__[a-f0-9-]{8}$/i, "");
}

function stripDeletedName(name: string): string {
  return name.replace(/ \(deleted\)$/i, "");
}

async function assertUniqueSlug(
  model: "hospital" | "patient" | "doctor" | "medication" | "case",
  slug: string,
  id: string
): Promise<void> {
  const where: Prisma.HospitalWhereInput = { slug, ...NOT_DELETED, NOT: { id } };
  let conflict = false;
  switch (model) {
    case "hospital":
      conflict = !!(await prisma.hospital.findFirst({ where, select: { id: true } }));
      break;
    case "patient":
      conflict = !!(await prisma.patient.findFirst({ where: { slug, ...NOT_DELETED, NOT: { id } }, select: { id: true } }));
      break;
    case "doctor":
      conflict = !!(await prisma.doctor.findFirst({ where: { slug, ...NOT_DELETED, NOT: { id } }, select: { id: true } }));
      break;
    case "medication":
      conflict = !!(await prisma.medication.findFirst({ where: { slug, ...NOT_DELETED, NOT: { id } }, select: { id: true } }));
      break;
    case "case":
      conflict = !!(await prisma.case.findFirst({ where: { slug, ...NOT_DELETED, NOT: { id } }, select: { id: true } }));
      break;
  }
  if (conflict) throw new Error("SLUG_CONFLICT");
}

export async function restoreEntity(entityType: RecycleBinEntityType, id: string): Promise<void> {
  switch (entityType) {
    case "case": {
      const record = await prisma.case.findFirst({ where: { id, deletedAt: { not: null } } });
      if (!record) throw new Error("NOT_FOUND");
      const slug = stripDeletedSuffix(record.slug);
      const caseNumber = stripDeletedSuffix(record.caseNumber);
      await assertUniqueSlug("case", slug, id);
      const caseNumberConflict = await prisma.case.findFirst({
        where: { caseNumber, ...NOT_DELETED, NOT: { id } },
        select: { id: true },
      });
      if (caseNumberConflict) throw new Error("SLUG_CONFLICT");
      await prisma.$transaction([
        prisma.case.update({
          where: { id },
          data: { deletedAt: null, deletedById: null, slug, caseNumber },
        }),
        prisma.evidence.updateMany({
          where: { caseId: id, deletedAt: { not: null } },
          data: { deletedAt: null, deletedById: null },
        }),
      ]);
      break;
    }
    case "hospital": {
      const record = await prisma.hospital.findFirst({ where: { id, deletedAt: { not: null } } });
      if (!record) throw new Error("NOT_FOUND");
      const name = stripDeletedName(record.name);
      const slug = slugify(name);
      await assertUniqueSlug("hospital", slug, id);
      const nameConflict = await prisma.hospital.findFirst({
        where: { name, ...NOT_DELETED, NOT: { id } },
        select: { id: true },
      });
      if (nameConflict) throw new Error("SLUG_CONFLICT");
      await prisma.hospital.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, name, slug },
      });
      break;
    }
    case "patient": {
      const record = await prisma.patient.findFirst({ where: { id, deletedAt: { not: null } } });
      if (!record) throw new Error("NOT_FOUND");
      const slug = slugify(record.fullName);
      await assertUniqueSlug("patient", slug, id);
      await prisma.patient.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, slug },
      });
      break;
    }
    case "doctor": {
      const record = await prisma.doctor.findFirst({ where: { id, deletedAt: { not: null } } });
      if (!record) throw new Error("NOT_FOUND");
      const slug = slugify(record.fullName);
      await assertUniqueSlug("doctor", slug, id);
      await prisma.doctor.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, slug },
      });
      break;
    }
    case "medication": {
      const record = await prisma.medication.findFirst({ where: { id, deletedAt: { not: null } } });
      if (!record) throw new Error("NOT_FOUND");
      const slug = slugify(record.name);
      await assertUniqueSlug("medication", slug, id);
      await prisma.medication.update({
        where: { id },
        data: { deletedAt: null, deletedById: null, slug },
      });
      break;
    }
    case "evidence": {
      const record = await prisma.evidence.findFirst({ where: { id, deletedAt: { not: null } } });
      if (!record) throw new Error("NOT_FOUND");
      const parentCase = await prisma.case.findFirst({ where: { id: record.caseId, ...NOT_DELETED } });
      if (!parentCase) throw new Error("PARENT_DELETED");
      await prisma.evidence.update({
        where: { id },
        data: { deletedAt: null, deletedById: null },
      });
      break;
    }
    case "contact_message": {
      const record = await prisma.contactMessage.findFirst({ where: { id, deletedAt: { not: null } } });
      if (!record) throw new Error("NOT_FOUND");
      await prisma.contactMessage.update({
        where: { id },
        data: { deletedAt: null, deletedById: null },
      });
      break;
    }
    default:
      throw new Error("INVALID_ENTITY");
  }
}

export async function permanentlyDeleteEntity(entityType: RecycleBinEntityType, id: string): Promise<void> {
  const deletedWhere = { id, deletedAt: { not: null } };

  switch (entityType) {
    case "case":
      await prisma.case.delete({ where: { id } });
      break;
    case "hospital":
      if (!(await prisma.hospital.findFirst({ where: deletedWhere }))) throw new Error("NOT_FOUND");
      await prisma.hospital.delete({ where: { id } });
      break;
    case "patient":
      if (!(await prisma.patient.findFirst({ where: deletedWhere }))) throw new Error("NOT_FOUND");
      await prisma.patient.delete({ where: { id } });
      break;
    case "doctor":
      if (!(await prisma.doctor.findFirst({ where: deletedWhere }))) throw new Error("NOT_FOUND");
      await prisma.doctor.delete({ where: { id } });
      break;
    case "medication":
      if (!(await prisma.medication.findFirst({ where: deletedWhere }))) throw new Error("NOT_FOUND");
      await prisma.medication.delete({ where: { id } });
      break;
    case "evidence":
      if (!(await prisma.evidence.findFirst({ where: deletedWhere }))) throw new Error("NOT_FOUND");
      await prisma.evidence.delete({ where: { id } });
      break;
    case "contact_message":
      if (!(await prisma.contactMessage.findFirst({ where: deletedWhere }))) throw new Error("NOT_FOUND");
      await prisma.contactMessage.delete({ where: { id } });
      break;
    default:
      throw new Error("INVALID_ENTITY");
  }
}

export async function listRecycleBinItems(): Promise<RecycleBinItem[]> {
  const deletedOnly = { deletedAt: { not: null } as const };

  const [cases, hospitals, patients, doctors, medications, evidence, messages] = await Promise.all([
    prisma.case.findMany({
      where: deletedOnly,
      orderBy: { deletedAt: "desc" },
      select: { id: true, title: true, caseNumber: true, deletedAt: true, deletedById: true },
    }),
    prisma.hospital.findMany({
      where: deletedOnly,
      orderBy: { deletedAt: "desc" },
      select: { id: true, name: true, deletedAt: true, deletedById: true },
    }),
    prisma.patient.findMany({
      where: deletedOnly,
      orderBy: { deletedAt: "desc" },
      select: { id: true, fullName: true, deletedAt: true, deletedById: true },
    }),
    prisma.doctor.findMany({
      where: deletedOnly,
      orderBy: { deletedAt: "desc" },
      select: { id: true, fullName: true, deletedAt: true, deletedById: true },
    }),
    prisma.medication.findMany({
      where: deletedOnly,
      orderBy: { deletedAt: "desc" },
      select: { id: true, name: true, deletedAt: true, deletedById: true },
    }),
    prisma.evidence.findMany({
      where: deletedOnly,
      orderBy: { deletedAt: "desc" },
      select: { id: true, fileName: true, description: true, caseId: true, deletedAt: true, deletedById: true },
    }),
    prisma.contactMessage.findMany({
      where: deletedOnly,
      orderBy: { deletedAt: "desc" },
      select: { id: true, subject: true, name: true, deletedAt: true, deletedById: true },
    }),
  ]);

  const adminIds = [
    ...new Set(
      [...cases, ...hospitals, ...patients, ...doctors, ...medications, ...evidence, ...messages]
        .map((row) => row.deletedById)
        .filter((id): id is string => !!id)
    ),
  ];
  const admins = adminIds.length
    ? await prisma.admin.findMany({ where: { id: { in: adminIds } }, select: { id: true, name: true } })
    : [];
  const adminNameById = new Map(admins.map((a) => [a.id, a.name]));

  const items: RecycleBinItem[] = [
    ...cases.map((row) => ({
      id: row.id,
      entityType: "case" as const,
      label: row.title,
      meta: row.caseNumber.replace(/__deleted__[a-f0-9-]{8}$/i, ""),
      deletedAt: row.deletedAt!,
      deletedById: row.deletedById,
      deletedByName: row.deletedById ? (adminNameById.get(row.deletedById) ?? null) : null,
    })),
    ...hospitals.map((row) => ({
      id: row.id,
      entityType: "hospital" as const,
      label: stripDeletedName(row.name),
      deletedAt: row.deletedAt!,
      deletedById: row.deletedById,
      deletedByName: row.deletedById ? (adminNameById.get(row.deletedById) ?? null) : null,
    })),
    ...patients.map((row) => ({
      id: row.id,
      entityType: "patient" as const,
      label: row.fullName,
      deletedAt: row.deletedAt!,
      deletedById: row.deletedById,
      deletedByName: row.deletedById ? (adminNameById.get(row.deletedById) ?? null) : null,
    })),
    ...doctors.map((row) => ({
      id: row.id,
      entityType: "doctor" as const,
      label: row.fullName,
      deletedAt: row.deletedAt!,
      deletedById: row.deletedById,
      deletedByName: row.deletedById ? (adminNameById.get(row.deletedById) ?? null) : null,
    })),
    ...medications.map((row) => ({
      id: row.id,
      entityType: "medication" as const,
      label: row.name,
      deletedAt: row.deletedAt!,
      deletedById: row.deletedById,
      deletedByName: row.deletedById ? (adminNameById.get(row.deletedById) ?? null) : null,
    })),
    ...evidence.map((row) => ({
      id: row.id,
      entityType: "evidence" as const,
      label: row.fileName ?? row.description ?? "Evidence file",
      meta: row.caseId,
      deletedAt: row.deletedAt!,
      deletedById: row.deletedById,
      deletedByName: row.deletedById ? (adminNameById.get(row.deletedById) ?? null) : null,
    })),
    ...messages.map((row) => ({
      id: row.id,
      entityType: "contact_message" as const,
      label: row.subject,
      meta: row.name,
      deletedAt: row.deletedAt!,
      deletedById: row.deletedById,
      deletedByName: row.deletedById ? (adminNameById.get(row.deletedById) ?? null) : null,
    })),
  ];

  items.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
  return items;
}

export function isRecycleBinEntityType(value: string): value is RecycleBinEntityType {
  return (RECYCLE_BIN_ENTITY_TYPES as readonly string[]).includes(value);
}

export function mapSoftDeleteError(error: unknown): { status: number; message: string } | null {
  if (!(error instanceof Error)) return null;
  switch (error.message) {
    case "NOT_FOUND":
      return { status: 404, message: "Record not found" };
    case "SLUG_CONFLICT":
      return { status: 409, message: "Cannot restore because an active record already uses this name or slug" };
    case "PARENT_DELETED":
      return { status: 409, message: "Restore the parent case before restoring this evidence" };
    case "INVALID_ENTITY":
      return { status: 400, message: "Invalid item type" };
    default:
      return null;
  }
}
