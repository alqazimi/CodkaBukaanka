import { Router, type Response } from "express";
import multer from "multer";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  generateSecret as generateTotpSecret,
  generateURI as generateTotpUri,
} from "otplib";
import { verifyAdminTotp } from "../lib/totp.js";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/audit.js";
import { slugify } from "../lib/utils.js";
import { generateCaseNumber } from "../lib/case-number.js";
import { requireAuth } from "../middleware/auth.js";
import { requireDeleteActionToken, requireMfaWhenEnforced } from "../middleware/admin-hardening.js";
import { asyncHandler } from "../lib/async-handler.js";
import { uploadToCloudinary, isCloudinaryConfigured } from "../lib/cloudinary.js";
import {
  canFallbackToLocalUploads,
  canUseLocalStorage,
  saveLocalUpload,
  shouldPreferLocalUploads,
} from "../lib/local-upload.js";
import { isAllowedUploadMime, resolveUploadMime } from "../lib/upload-mime.js";
import { ALLOWED_UPLOAD_MIMES, MAX_UPLOAD_BYTES } from "../lib/constants.js";
import { validateUploadFile } from "../lib/file-validation.js";
import { caseSchema, casePatchSchema, evidenceVisibilitySchema, adminCaseListSchema, auditListSchema } from "../lib/schemas.js";
import { getAdminAnalytics, runRiskAnalysis } from "../lib/risk-analysis.js";
import { looksLikePromptInjection } from "../lib/prompt-guard.js";
import { CaseWorkflowError, isCreatableCaseStatus, validateStatusTransition } from "../lib/case-workflow.js";
import { assertSafeEvidenceUrl } from "../lib/safe-url.js";
import { incrementAdminTokenVersion } from "../lib/token-version.js";
import { Prisma } from "@prisma/client";
import type { CaseStatus, EvidenceLevel, EvidenceType, InboxStatus } from "@prisma/client";

const isProduction = process.env.NODE_ENV === "production";

const router = Router();
router.use(requireAuth);
router.use(requireMfaWhenEnforced);
router.use(requireDeleteActionToken);

const inboxTypeSchema = z.enum(["contact", "correction", "all"]).optional();
const createAdminSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(2).max(120),
  password: z.string().min(8).max(256),
});
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256).optional(),
  newPassword: z.string().min(8).max(256),
});
const mfaSetupSchema = z.object({
  currentPassword: z.string().min(1).max(256),
});
const mfaVerifySchema = z.object({
  token: z.string().regex(/^\d{6}$/),
});
const mfaDisableSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  token: z.string().regex(/^\d{6}$/),
});
const inboxPatchSchema = z.object({
  status: z.enum(["NEW", "READ", "ARCHIVED"]).optional(),
  internalNote: z.string().max(5000).optional().nullable(),
  linkedCaseId: z.string().uuid().optional().nullable(),
});
const inboxStatusFilterSchema = z.enum(["new", "read", "archived", "all"]).optional();
const mergeEntitySchema = z.object({
  keepId: z.string().uuid(),
  mergeId: z.string().uuid(),
});
const adminPatchSchema = z.object({
  active: z.boolean().optional(),
  role: z.enum(["admin", "owner"]).optional(),
});

function parseCorrectionSlug(subject: string): string | null {
  const match = subject.match(/^Correction:\s*(.+)$/i);
  return match?.[1]?.trim() || null;
}

async function resolveLinkedCaseId(subject: string, linkedCaseId?: string | null): Promise<string | null> {
  if (linkedCaseId) return linkedCaseId;
  const slugHint = parseCorrectionSlug(subject);
  if (!slugHint) return null;
  const bySlug = await prisma.case.findFirst({ where: { slug: slugHint }, select: { id: true } });
  if (bySlug) return bySlug.id;
  const byNumber = await prisma.case.findFirst({ where: { caseNumber: slugHint }, select: { id: true } });
  return byNumber?.id ?? null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (isAllowedUploadMime(file.mimetype, file.originalname)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function handleDeleteError(error: unknown, res: Response): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      res.status(409).json({ error: "Cannot delete because this record is used by existing cases." });
      return true;
    }
    if (error.code === "P2025") {
      res.status(404).json({ error: "Record not found" });
      return true;
    }
  }
  return false;
}

router.get("/dashboard", asyncHandler(async (req, res) => {
  const analytics = await getAdminAnalytics();
  const isOwner = req.admin?.role === "owner";
  const [recentLogs, recentCases] = await Promise.all([
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      where: isOwner ? undefined : { adminId: req.admin!.id },
      include: { admin: { select: { name: true } } },
    }),
    prisma.case.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: {
        hospital: { select: { name: true } },
        patient: { select: { fullName: true } },
      },
    }),
  ]);

  res.json({
    ...analytics,
    canViewGlobalAudit: isOwner,
    recentLogs,
    recentCases,
  });
}));

router.get("/analytics", asyncHandler(async (_req, res) => {
  res.json(await getAdminAnalytics());
}));

router.get("/inbox/unread-count", asyncHandler(async (_req, res) => {
  const count = await prisma.contactMessage.count({ where: { status: "NEW" } });
  res.json({ count });
}));

router.get("/inbox", asyncHandler(async (req, res) => {
  try {
    const type = inboxTypeSchema.safeParse(req.query.type).success ? (req.query.type as "contact" | "correction" | "all") : "all";
    const statusFilter = inboxStatusFilterSchema.safeParse(req.query.status).success
      ? (req.query.status as "new" | "read" | "archived" | "all")
      : "all";

    const typeWhere =
      type === "correction"
        ? { subject: { startsWith: "Correction", mode: "insensitive" as const } }
        : type === "contact"
          ? { NOT: { subject: { startsWith: "Correction", mode: "insensitive" as const } } }
          : {};

    const statusWhere =
      statusFilter === "all"
        ? {}
        : { status: statusFilter.toUpperCase() as InboxStatus };

    const messages = await prisma.contactMessage.findMany({
      where: { ...typeWhere, ...statusWhere },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        linkedCase: { select: { id: true, caseNumber: true, title: true, slug: true } },
        readBy: { select: { name: true } },
      },
    });

    const enriched = await Promise.all(
      messages.map(async (message) => {
        const autoLinkedCaseId = message.linkedCaseId ?? (await resolveLinkedCaseId(message.subject));
        return {
          ...message,
          linkedCaseId: autoLinkedCaseId,
          suspicious: looksLikePromptInjection(`${message.subject}\n${message.message}`),
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inbox query failed";
    const needsMigration = /column|InboxStatus|does not exist|P2022/i.test(message);
    console.error("[inbox]", error);
    res.status(needsMigration ? 503 : 500).json({
      error: needsMigration
        ? "Database schema is out of date. Run prisma migrate deploy on Railway."
        : "Could not load inbox",
      code: needsMigration ? "db_migration_required" : undefined,
    });
  }
}));

router.patch("/inbox/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const body = inboxPatchSchema.parse(req.body);
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const nextStatus = body.status;
  const updated = await prisma.contactMessage.update({
    where: { id },
    data: {
      status: nextStatus,
      internalNote: body.internalNote === undefined ? undefined : body.internalNote,
      linkedCaseId: body.linkedCaseId === undefined ? undefined : body.linkedCaseId,
      readAt:
        nextStatus === "READ" || nextStatus === "ARCHIVED"
          ? existing.readAt ?? new Date()
          : nextStatus === "NEW"
            ? null
            : undefined,
      readById:
        nextStatus === "READ" || nextStatus === "ARCHIVED"
          ? req.admin!.id
          : nextStatus === "NEW"
            ? null
            : undefined,
    },
    include: {
      linkedCase: { select: { id: true, caseNumber: true, title: true, slug: true } },
      readBy: { select: { name: true } },
    },
  });

  await logAudit({
    adminId: req.admin!.id,
    action: "UPDATE",
    entityType: "contact_message",
    entityId: id,
  });
  res.json(updated);
}));

router.delete("/inbox/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  await prisma.contactMessage.delete({ where: { id } });
  await logAudit({
    adminId: req.admin!.id,
    action: "DELETE",
    entityType: "contact_message",
    entityId: id,
  });
  res.json({ ok: true });
}));

router.get("/admins", asyncHandler(async (_req, res) => {
  if (_req.admin?.role !== "owner") {
    res.status(403).json({ error: "Only owner can list all admins" });
    return;
  }
  const admins = await prisma.admin.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      lockedUntil: true,
      failedLoginAttempts: true,
      totpEnabled: true,
    },
  });
  res.json(admins);
}));

router.patch("/admins/:id", asyncHandler(async (req, res) => {
  if (req.admin?.role !== "owner") {
    res.status(403).json({ error: "Only owner can update admin accounts" });
    return;
  }
  const id = paramValue(req.params.id);
  const body = adminPatchSchema.parse(req.body);
  if (id === req.admin.id && body.active === false) {
    res.status(400).json({ error: "You cannot deactivate your own account" });
    return;
  }
  const updated = await prisma.admin.update({
    where: { id },
    data: {
      active: body.active,
      role: body.role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      totpEnabled: true,
      lockedUntil: true,
    },
  });
  if (body.active === false) {
    await incrementAdminTokenVersion(id);
  }
  await logAudit({
    adminId: req.admin!.id,
    action: "UPDATE",
    entityType: "admin",
    entityId: id,
    details: JSON.stringify(body),
  });
  res.json(updated);
}));

router.post("/admins/:id/unlock", asyncHandler(async (req, res) => {
  if (req.admin?.role !== "owner") {
    res.status(403).json({ error: "Only owner can unlock accounts" });
    return;
  }
  const id = paramValue(req.params.id);
  await prisma.admin.update({
    where: { id },
    data: { lockedUntil: null, failedLoginAttempts: 0 },
  });
  await logAudit({ adminId: req.admin!.id, action: "UPDATE", entityType: "admin_unlock", entityId: id });
  res.json({ ok: true });
}));

router.post("/admins/:id/invalidate-sessions", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  if (req.admin?.role !== "owner" && req.admin?.id !== id) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await incrementAdminTokenVersion(id);
  await logAudit({
    adminId: req.admin!.id,
    action: "UPDATE",
    entityType: "admin_sessions_invalidated",
    entityId: id,
  });
  res.json({ ok: true });
}));

router.post("/admins", asyncHandler(async (req, res) => {
  if (req.admin?.role !== "owner") {
    res.status(403).json({ error: "Only owner can add admins" });
    return;
  }

  const data = createAdminSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(data.password, 12);
  const created = await prisma.admin.create({
    data: {
      email: data.email.toLowerCase(),
      name: data.name,
      role: "admin",
      passwordHash,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  await logAudit({
    adminId: req.admin!.id,
    action: "CREATE",
    entityType: "admin",
    entityId: created.id,
  });

  res.status(201).json(created);
}));

router.patch("/admins/:id/password", asyncHandler(async (req, res) => {
  const data = changePasswordSchema.parse(req.body);
  const actor = req.admin!;
  const targetId = paramValue(req.params.id);
  const isSelf = actor.id === targetId;
  const isOwner = actor.role === "owner";

  if (!isSelf && !isOwner) {
    res.status(403).json({ error: "Not allowed" });
    return;
  }

  const target = await prisma.admin.findUnique({ where: { id: targetId } });
  if (!target) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }

  if (isSelf && data.currentPassword) {
    const ok = await bcrypt.compare(data.currentPassword, target.passwordHash);
    if (!ok) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
  } else if (isSelf && !isOwner) {
    res.status(400).json({ error: "Current password is required" });
    return;
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.admin.update({
    where: { id: targetId },
    data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null, tokenVersion: { increment: 1 } },
  });

  await logAudit({
    adminId: actor.id,
    action: "UPDATE",
    entityType: "admin_password",
    entityId: targetId,
  });

  res.json({ ok: true });
}));

router.post("/security/mfa/setup", asyncHandler(async (req, res) => {
  const actor = req.admin!;
  const data = mfaSetupSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { id: actor.id } });
  if (!admin) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }
  const passwordOk = await bcrypt.compare(data.currentPassword, admin.passwordHash);
  if (!passwordOk) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  const secret = await generateTotpSecret();
  await prisma.admin.update({
    where: { id: actor.id },
    data: { totpSecret: secret, totpEnabled: false },
  });

  const issuer = "Diiwaanka Bukaanka";
  const label = `${issuer}:${admin.email}`;
  const otpauthUrl = await generateTotpUri({
    secret,
    issuer,
    label,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });

  await logAudit({
    adminId: actor.id,
    action: "UPDATE",
    entityType: "mfa_setup_started",
    entityId: actor.id,
  });

  res.json({ ok: true, secret, otpauthUrl, label });
}));

router.get("/security/mfa/status", asyncHandler(async (req, res) => {
  const actor = req.admin!;
  const admin = await prisma.admin.findUnique({
    where: { id: actor.id },
    select: {
      email: true,
      totpEnabled: true,
      totpSecret: true,
      updatedAt: true,
    },
  });
  if (!admin) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }
  res.json({
    email: admin.email,
    enabled: admin.totpEnabled,
    setupInProgress: Boolean(admin.totpSecret) && !admin.totpEnabled,
    updatedAt: admin.updatedAt,
  });
}));

router.post("/security/mfa/verify", asyncHandler(async (req, res) => {
  const actor = req.admin!;
  const data = mfaVerifySchema.parse(req.body);
  const admin = await prisma.admin.findUnique({
    where: { id: actor.id },
    select: { id: true, totpSecret: true },
  });
  if (!admin?.totpSecret) {
    res.status(400).json({ error: "MFA setup has not been started" });
    return;
  }
  const valid = await verifyAdminTotp(data.token, admin.totpSecret);
  if (!valid) {
    res.status(401).json({ error: "Invalid authenticator code" });
    return;
  }

  await prisma.admin.update({
    where: { id: actor.id },
    data: { totpEnabled: true },
  });

  await logAudit({
    adminId: actor.id,
    action: "UPDATE",
    entityType: "mfa_enabled",
    entityId: actor.id,
  });
  res.json({ ok: true });
}));

router.post("/security/mfa/disable", asyncHandler(async (req, res) => {
  if (isProduction) {
    res.status(403).json({ error: "MFA cannot be disabled in production. Contact the owner for account recovery." });
    return;
  }
  const actor = req.admin!;
  const data = mfaDisableSchema.parse(req.body);
  const admin = await prisma.admin.findUnique({ where: { id: actor.id } });
  if (!admin) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }
  const passwordOk = await bcrypt.compare(data.currentPassword, admin.passwordHash);
  if (!passwordOk) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }
  if (!admin.totpSecret || !(await verifyAdminTotp(data.token, admin.totpSecret))) {
    res.status(401).json({ error: "Invalid authenticator code" });
    return;
  }

  await prisma.admin.update({
    where: { id: actor.id },
    data: { totpEnabled: false, totpSecret: null },
  });
  await logAudit({
    adminId: actor.id,
    action: "UPDATE",
    entityType: "mfa_disabled",
    entityId: actor.id,
  });
  res.json({ ok: true });
}));

router.post("/security/invalidate-sessions", asyncHandler(async (req, res) => {
  await incrementAdminTokenVersion(req.admin!.id);
  await logAudit({
    adminId: req.admin!.id,
    action: "UPDATE",
    entityType: "admin_sessions_invalidated",
    entityId: req.admin!.id,
  });
  res.json({ ok: true });
}));

router.get("/audit", asyncHandler(async (req, res) => {
  const query = auditListSchema.parse(req.query);
  const isOwner = req.admin?.role === "owner";
  const where: Prisma.AuditLogWhereInput = {};

  if (!isOwner) {
    where.adminId = req.admin!.id;
  } else if (query.adminId) {
    where.adminId = query.adminId;
  }
  if (query.action) where.action = query.action;
  if (query.entityType) where.entityType = query.entityType;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.limit,
      include: { admin: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    items,
    total,
    page: query.page,
    limit: query.limit,
    canViewGlobalAudit: isOwner,
  });
}));

router.get("/risk-analysis", asyncHandler(async (_req, res) => {
  res.json(await runRiskAnalysis());
}));

const caseSchemaLegacy = caseSchema;
const casePatchSchemaLegacy = casePatchSchema;

router.get("/cases", asyncHandler(async (req, res) => {
  const query = adminCaseListSchema.parse(req.query);
  const where: Prisma.CaseWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.hospitalId) where.hospitalId = query.hospitalId;
  if (query.riskLevel) where.riskLevel = query.riskLevel;
  if (query.authorId) where.authorId = query.authorId;

  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { caseNumber: { contains: query.q, mode: "insensitive" } },
      { hospital: { name: { contains: query.q, mode: "insensitive" } } },
      { patient: { fullName: { contains: query.q, mode: "insensitive" } } },
    ];
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    prisma.case.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: query.limit,
      include: {
        hospital: { select: { name: true, location: true } },
        patient: { select: { fullName: true } },
        doctor: { select: { fullName: true } },
        medication: { select: { name: true } },
        author: { select: { name: true } },
        evidence: { select: { visibility: true } },
        _count: { select: { evidence: true } },
      },
    }),
    prisma.case.count({ where }),
  ]);

  res.json({
    items: items.map(({ evidence, ...rest }) => ({
      ...rest,
      publicEvidenceCount: evidence.filter((e) => e.visibility === "PUBLIC").length,
    })),
    total,
    page: query.page,
    limit: query.limit,
  });
}));

router.post("/cases", asyncHandler(async (req, res) => {
  const data = caseSchemaLegacy.parse(req.body);
  const status = data.status as CaseStatus;
  if (!isCreatableCaseStatus(status)) {
    res.status(400).json({ error: "New cases must start as DRAFT or UNDER_REVIEW" });
    return;
  }
  const slug = slugify(data.title);
  const caseNumber = await generateCaseNumber();
  const caseRecord = await prisma.case.create({
    data: {
      caseNumber,
      title: data.title,
      slug: `${slug}-${Date.now()}`,
      reasonForVisit: data.reasonForVisit,
      incidentDescription: data.incidentDescription,
      currentCondition: data.currentCondition,
      internalNotes: data.internalNotes ?? null,
      whatWentWrong: data.whatWentWrong,
      category: data.category,
      status,
      riskLevel: data.riskLevel,
      evidenceLevel: (data.evidenceLevel as EvidenceLevel) ?? "LOW",
      incidentDate: new Date(data.incidentDate),
      publishedAt: null,
      hospitalId: data.hospitalId,
      patientId: data.patientId,
      doctorId: data.doctorId || null,
      medicationId: data.medicationId || null,
      authorId: req.admin!.id,
    },
  });
  await logAudit({ adminId: req.admin!.id, action: "CREATE", entityType: "case", entityId: caseRecord.id });
  res.status(201).json(caseRecord);
}));

router.get("/cases/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: {
      hospital: true,
      patient: true,
      doctor: true,
      medication: true,
      evidence: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!caseRecord) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(caseRecord);
}));

router.patch("/cases/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const body = casePatchSchemaLegacy.parse(req.body);
  const existing = await prisma.case.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const newStatus = body.status as CaseStatus | undefined;
  try {
    validateStatusTransition(existing.status, newStatus);
  } catch (error) {
    if (error instanceof CaseWorkflowError) {
      res.status(400).json({ error: error.message });
      return;
    }
    throw error;
  }

  const publishedAt =
    newStatus === "PUBLISHED" && existing.status !== "PUBLISHED"
      ? new Date()
      : newStatus && newStatus !== "PUBLISHED"
        ? null
        : undefined;

  const caseRecord = await prisma.case.update({
    where: { id },
    data: {
      title: body.title,
      reasonForVisit: body.reasonForVisit,
      incidentDescription: body.incidentDescription,
      currentCondition: body.currentCondition,
      internalNotes: body.internalNotes === undefined ? undefined : body.internalNotes,
      whatWentWrong: body.whatWentWrong,
      category: body.category,
      status: newStatus,
      riskLevel: body.riskLevel,
      evidenceLevel: body.evidenceLevel as EvidenceLevel | undefined,
      incidentDate: body.incidentDate ? new Date(body.incidentDate) : undefined,
      hospitalId: body.hospitalId,
      patientId: body.patientId,
      doctorId: body.doctorId === null ? null : body.doctorId,
      medicationId: body.medicationId === null ? null : body.medicationId,
      publishedAt,
    },
  });

  await logAudit({
    adminId: req.admin!.id,
    action: newStatus === "PUBLISHED" ? "PUBLISH" : "UPDATE",
    entityType: "case",
    entityId: id,
  });
  res.json(caseRecord);
}));

router.delete("/cases/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  await prisma.case.delete({ where: { id } });
  await logAudit({ adminId: req.admin!.id, action: "DELETE", entityType: "case", entityId: id });
  res.json({ ok: true });
}));

const hospitalSchema = z.object({
  name: z.string().trim().min(2).max(200),
  location: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
});

function hospitalCreateData(data: z.infer<typeof hospitalSchema>) {
  return {
    name: data.name,
    location: data.location,
    slug: slugify(data.name),
    ...(data.description ? { description: data.description } : {}),
  };
}

function hospitalUpdateData(data: Partial<z.infer<typeof hospitalSchema>>) {
  const update: {
    name?: string;
    location?: string;
    description?: string | null;
  } = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.location !== undefined) update.location = data.location;
  if (data.description !== undefined) {
    update.description = data.description || null;
  }
  return update;
}

function handleHospitalWriteError(error: unknown, res: Response): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    res.status(409).json({ error: "A hospital with this name already exists" });
    return true;
  }
  return false;
}

router.get("/hospitals", asyncHandler(async (_req, res) => {
  const hospitals = await prisma.hospital.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { cases: true, doctors: true } } },
  });
  res.json(hospitals);
}));

router.post("/hospitals", asyncHandler(async (req, res) => {
  const data = hospitalSchema.parse(req.body);
  try {
    const hospital = await prisma.hospital.create({
      data: hospitalCreateData(data),
    });
    await logAudit({ adminId: req.admin!.id, action: "CREATE", entityType: "hospital", entityId: hospital.id });
    res.status(201).json(hospital);
  } catch (error) {
    if (handleHospitalWriteError(error, res)) return;
    throw error;
  }
}));

router.patch("/hospitals/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const data = hospitalSchema.partial().parse(req.body);
  try {
    const hospital = await prisma.hospital.update({
      where: { id },
      data: hospitalUpdateData(data),
    });
    await logAudit({ adminId: req.admin!.id, action: "UPDATE", entityType: "hospital", entityId: hospital.id });
    res.json(hospital);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      res.status(404).json({ error: "Hospital not found" });
      return;
    }
    if (handleHospitalWriteError(error, res)) return;
    throw error;
  }
}));

router.delete("/hospitals/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  try {
    await prisma.hospital.delete({ where: { id } });
  } catch (error) {
    if (handleDeleteError(error, res)) return;
    throw error;
  }
  await logAudit({ adminId: req.admin!.id, action: "DELETE", entityType: "hospital", entityId: id });
  res.json({ ok: true });
}));

router.post("/hospitals/merge", asyncHandler(async (req, res) => {
  if (req.admin?.role !== "owner") {
    res.status(403).json({ error: "Only owner can merge records" });
    return;
  }
  const { keepId, mergeId } = mergeEntitySchema.parse(req.body);
  if (keepId === mergeId) {
    res.status(400).json({ error: "Cannot merge a record with itself" });
    return;
  }
  await prisma.$transaction([
    prisma.case.updateMany({ where: { hospitalId: mergeId }, data: { hospitalId: keepId } }),
    prisma.doctor.updateMany({ where: { hospitalId: mergeId }, data: { hospitalId: keepId } }),
    prisma.hospital.delete({ where: { id: mergeId } }),
  ]);
  await logAudit({
    adminId: req.admin!.id,
    action: "UPDATE",
    entityType: "hospital_merge",
    entityId: keepId,
    details: JSON.stringify({ mergeId }),
  });
  res.json({ ok: true, keepId });
}));

const patientSchema = z.object({
  fullName: z.string().min(2).max(200),
  age: z.coerce.number().int().min(0).max(150).optional(),
  gender: z.string().max(50).optional(),
});

router.get("/patients", asyncHandler(async (_req, res) => {
  const patients = await prisma.patient.findMany({
    orderBy: { fullName: "asc" },
    include: { _count: { select: { cases: true } } },
  });
  res.json(patients);
}));

router.post("/patients", asyncHandler(async (req, res) => {
  const data = patientSchema.parse(req.body);
  const patient = await prisma.patient.create({
    data: { ...data, slug: slugify(data.fullName) },
  });
  await logAudit({ adminId: req.admin!.id, action: "CREATE", entityType: "patient", entityId: patient.id });
  res.status(201).json(patient);
}));

router.patch("/patients/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const data = patientSchema.partial().parse(req.body);
  const patient = await prisma.patient.update({
    where: { id },
    data: { ...data, slug: data.fullName ? slugify(data.fullName) : undefined },
  });
  await logAudit({ adminId: req.admin!.id, action: "UPDATE", entityType: "patient", entityId: patient.id });
  res.json(patient);
}));

router.delete("/patients/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  try {
    await prisma.patient.delete({ where: { id } });
  } catch (error) {
    if (handleDeleteError(error, res)) return;
    throw error;
  }
  await logAudit({ adminId: req.admin!.id, action: "DELETE", entityType: "patient", entityId: id });
  res.json({ ok: true });
}));

router.post("/patients/merge", asyncHandler(async (req, res) => {
  if (req.admin?.role !== "owner") {
    res.status(403).json({ error: "Only owner can merge records" });
    return;
  }
  const { keepId, mergeId } = mergeEntitySchema.parse(req.body);
  if (keepId === mergeId) {
    res.status(400).json({ error: "Cannot merge a record with itself" });
    return;
  }
  await prisma.$transaction([
    prisma.case.updateMany({ where: { patientId: mergeId }, data: { patientId: keepId } }),
    prisma.patient.delete({ where: { id: mergeId } }),
  ]);
  await logAudit({
    adminId: req.admin!.id,
    action: "UPDATE",
    entityType: "patient_merge",
    entityId: keepId,
    details: JSON.stringify({ mergeId }),
  });
  res.json({ ok: true, keepId });
}));

const doctorSchema = z.object({
  fullName: z.string().min(2).max(200),
  specialty: z.string().max(200).optional(),
  hospitalId: z.string().uuid().optional().nullable(),
});

router.get("/doctors", asyncHandler(async (_req, res) => {
  res.json(
    await prisma.doctor.findMany({
      orderBy: { fullName: "asc" },
      include: { hospital: { select: { name: true } } },
    })
  );
}));

router.post("/doctors", asyncHandler(async (req, res) => {
  const data = doctorSchema.parse(req.body);
  const doctor = await prisma.doctor.create({
    data: {
      fullName: data.fullName,
      specialty: data.specialty,
      hospitalId: data.hospitalId || null,
      slug: slugify(data.fullName),
    },
  });
  await logAudit({ adminId: req.admin!.id, action: "CREATE", entityType: "doctor", entityId: doctor.id });
  res.status(201).json(doctor);
}));

router.patch("/doctors/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const data = doctorSchema.partial().parse(req.body);
  const doctor = await prisma.doctor.update({
    where: { id },
    data: {
      fullName: data.fullName,
      specialty: data.specialty,
      hospitalId: data.hospitalId === null ? null : data.hospitalId,
      slug: data.fullName ? slugify(data.fullName) : undefined,
    },
  });
  await logAudit({ adminId: req.admin!.id, action: "UPDATE", entityType: "doctor", entityId: doctor.id });
  res.json(doctor);
}));

router.delete("/doctors/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  try {
    await prisma.doctor.delete({ where: { id } });
  } catch (error) {
    if (handleDeleteError(error, res)) return;
    throw error;
  }
  await logAudit({ adminId: req.admin!.id, action: "DELETE", entityType: "doctor", entityId: id });
  res.json({ ok: true });
}));

const medicationSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.string().max(100).optional(),
});

router.get("/medications", asyncHandler(async (_req, res) => {
  res.json(await prisma.medication.findMany({ orderBy: { name: "asc" } }));
}));

router.post("/medications", asyncHandler(async (req, res) => {
  const data = medicationSchema.parse(req.body);
  const medication = await prisma.medication.create({
    data: { ...data, slug: slugify(data.name) },
  });
  await logAudit({ adminId: req.admin!.id, action: "CREATE", entityType: "medication", entityId: medication.id });
  res.status(201).json(medication);
}));

router.patch("/medications/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const data = medicationSchema.partial().parse(req.body);
  const medication = await prisma.medication.update({
    where: { id },
    data: { ...data, slug: data.name ? slugify(data.name) : undefined },
  });
  await logAudit({ adminId: req.admin!.id, action: "UPDATE", entityType: "medication", entityId: medication.id });
  res.json(medication);
}));

router.delete("/medications/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  try {
    await prisma.medication.delete({ where: { id } });
  } catch (error) {
    if (handleDeleteError(error, res)) return;
    throw error;
  }
  await logAudit({ adminId: req.admin!.id, action: "DELETE", entityType: "medication", entityId: id });
  res.json({ ok: true });
}));

const evidenceSchema = z.object({
  caseId: z.string().uuid(),
  type: z.enum(["IMAGE", "VIDEO", "DOCUMENT"]),
  url: z.string().url().max(2000),
  visibility: evidenceVisibilitySchema.optional(),
  publicId: z.string().max(255).optional(),
  description: z.string().max(2000).optional(),
  fileName: z.string().max(255).optional(),
  mimeType: z.string().max(100).optional(),
  fileSize: z.number().int().positive().optional(),
});

router.get("/cases/:id/evidence", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const evidence = await prisma.evidence.findMany({
    where: { caseId: id },
    orderBy: { createdAt: "asc" },
  });
  res.json(evidence);
}));

router.post("/evidence", asyncHandler(async (req, res) => {
  const data = evidenceSchema.parse(req.body);
  try {
    assertSafeEvidenceUrl(data.url);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid evidence URL" });
    return;
  }
  const evidence = await prisma.evidence.create({
    data: {
      caseId: data.caseId,
      type: data.type as EvidenceType,
      url: data.url,
      visibility: data.visibility ?? "PRIVATE",
      publicId: data.publicId,
      description: data.description,
      fileName: data.fileName,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
    },
  });
  await logAudit({ adminId: req.admin!.id, action: "CREATE", entityType: "evidence", entityId: evidence.id });
  res.status(201).json(evidence);
}));

const evidencePatchSchema = z.object({
  visibility: evidenceVisibilitySchema.optional(),
  description: z.string().max(2000).optional(),
});

router.patch("/evidence/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  const body = evidencePatchSchema.parse(req.body);
  const evidence = await prisma.evidence.update({
    where: { id },
    data: body,
  });
  await logAudit({ adminId: req.admin!.id, action: "UPDATE", entityType: "evidence", entityId: id });
  res.json(evidence);
}));

router.delete("/evidence/:id", asyncHandler(async (req, res) => {
  const id = paramValue(req.params.id);
  await prisma.evidence.delete({ where: { id } });
  await logAudit({ adminId: req.admin!.id, action: "DELETE", entityType: "evidence", entityId: id });
  res.json({ ok: true });
}));

router.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        const message =
          msg === "File type not allowed"
            ? "File type not allowed. Use JPEG, PNG, WebP, GIF, MP4, WebM, PDF, or Word documents."
            : msg.includes("File too large")
              ? "File exceeds 10MB limit"
              : msg || "Upload failed";
        res.status(400).json({ error: message });
        return;
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file provided" });
    return;
  }

  const mimeType = resolveUploadMime(req.file.mimetype, req.file.originalname);
  const validation = validateUploadFile(req.file.buffer, mimeType, req.file.size);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  const useLocal = shouldPreferLocalUploads();
  const hasCloudinary = isCloudinaryConfigured();
  if (!hasCloudinary && !canUseLocalStorage()) {
    res.status(503).json({
      error:
        "File storage not configured. Set CLOUDINARY_* on Railway, or set API_PUBLIC_URL to your Railway API URL for local uploads.",
      code: "storage_not_configured",
    });
    return;
  }

  const visibility = evidenceVisibilitySchema.safeParse(req.body?.visibility).data ?? "PRIVATE";
  const folder =
    visibility === "PRIVATE"
      ? "diiwaanka-bukaanka/evidence/private"
      : "diiwaanka-bukaanka/evidence/public";

  const resourceType =
    mimeType.startsWith("video/") ? "video" :
    mimeType.startsWith("image/") ? "image" : "raw";

  let result: { url: string; publicId: string; bytes: number };

  if (useLocal || !hasCloudinary) {
    result = await saveLocalUpload(req.file.buffer, mimeType, req.file.originalname);
  } else {
    try {
      result = await uploadToCloudinary(req.file.buffer, {
        folder,
        resource_type: resourceType,
      });
    } catch (error) {
      if (!canFallbackToLocalUploads()) {
        console.error("[upload] Cloudinary failed:", error);
        res.status(502).json({
          error: "Cloudinary upload failed. Check CLOUDINARY_* credentials on Railway.",
          code: "cloudinary_failed",
        });
        return;
      }
      console.warn(
        "[upload] Cloudinary failed, using local storage:",
        error instanceof Error ? error.message : error
      );
      result = await saveLocalUpload(req.file.buffer, mimeType, req.file.originalname);
    }
  }

  const type: EvidenceType =
    resourceType === "video" ? "VIDEO" :
    resourceType === "image" ? "IMAGE" : "DOCUMENT";

  res.json({
    url: result.url,
    publicId: result.publicId,
    type,
    visibility,
    fileName: req.file.originalname,
    mimeType,
    fileSize: result.bytes,
  });
  })
);

export default router;
