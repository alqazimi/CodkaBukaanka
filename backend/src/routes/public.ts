import { Router } from "express";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";
import {
  findEvidenceForPublicStream,
  sendLocalEvidenceFile,
} from "../lib/evidence-access.js";
import {
  PUBLIC_CASE_SELECT,
  PUBLIC_CASE_INCLUDE,
  PUBLIC_CASE_CARD_INCLUDE,
  PUBLIC_EVIDENCE_SELECT,
  PUBLIC_HOSPITAL_SELECT,
  PUBLIC_PATIENT_SELECT,
  toPublicCase,
  toPublicPatientProfile,
  toPublicDoctorProfile,
} from "../lib/public-dto.js";
import {
  globalSearch,
  searchSuggestions,
  searchCases,
  getPublicStats,
  getMedicationProfile,
} from "../lib/search.js";
import { serializeEvidenceForPublic } from "../lib/evidence-serialize.js";
import { PUBLIC_CASE_FILTER, NOT_DELETED } from "../lib/constants.js";
import { rateLimit, getClientIp } from "../lib/rate-limit.js";
import { parsePagination, paginationMeta } from "../lib/pagination.js";
import { caseCategorySchema, riskLevelSchema } from "../lib/schemas.js";
import { rejectUntrustedPublicText, sanitizeUntrustedText } from "../lib/prompt-guard.js";
import { logAudit } from "../lib/audit.js";
import { rejectPublicFormBot } from "../lib/public-form-bot.js";
import {
  caseSubmissionSchema,
  caseSubmissionTextFields,
  CASE_SUBMISSION_WEEK_MS,
  validateSubmissionEvidenceRequirement,
} from "../lib/case-submission-schema.js";
import { z } from "zod";
import type { CaseCategory, RiskLevel } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import multer from "multer";
import { isAllowedUploadMime } from "../lib/upload-mime.js";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "../lib/constants.js";
import {
  MAX_SUBMISSION_EVIDENCE_FILES,
  uploadSubmissionEvidenceFile,
} from "../lib/submission-evidence-upload.js";

const router = Router();

const caseSubmissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: MAX_SUBMISSION_EVIDENCE_FILES },
  fileFilter: (_req, file, cb) => {
    if (isAllowedUploadMime(file.mimetype, file.originalname)) cb(null, true);
    else cb(new Error("File type not allowed"));
  },
});

function multerUploadErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Upload failed";
  if (msg === "File type not allowed") {
    return "File type not allowed. Use JPEG, PNG, WebP, GIF, MP4, WebM, PDF, or Word documents.";
  }
  if (msg.includes("File too large")) return `Each file must be ${MAX_UPLOAD_MB}MB or smaller.`;
  if (msg.includes("Too many files")) {
    return `You can upload at most ${MAX_SUBMISSION_EVIDENCE_FILES} files.`;
  }
  return msg || "Upload failed";
}

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Public evidence stream — only PUBLIC evidence on PUBLISHED cases (local storage). */
router.get("/evidence/stream/:storageKey", asyncHandler(async (req, res) => {
  const storageKey = paramValue(req.params.storageKey);
  if (!storageKey || !/^[\w.-]+$/.test(storageKey)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const evidence = await findEvidenceForPublicStream(storageKey);
  if (!evidence) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  if (!sendLocalEvidenceFile(res, storageKey, evidence.mimeType)) {
    res.status(404).json({ error: "Not found" });
  }
}));

const PUBLIC_EVIDENCE_FILTER = { visibility: "PUBLIC" as const };

function queryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

function resJsonPaginated<T>(items: T[], total: number, page: number, limit: number) {
  return { items, ...paginationMeta(total, page, limit) };
}

router.get("/search", asyncHandler(async (req, res) => {
  const ip = getClientIp(req);
  if (!(await rateLimit(`search:${ip}`)).success) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  const q = String(req.query.q ?? "").trim().slice(0, 200);
  let category: CaseCategory | undefined;
  let riskLevel: RiskLevel | undefined;

  if (req.query.category) {
    const parsed = caseCategorySchema.safeParse(req.query.category);
    if (parsed.success) category = parsed.data;
  }
  if (req.query.riskLevel) {
    const parsed = riskLevelSchema.safeParse(req.query.riskLevel);
    if (parsed.success) riskLevel = parsed.data;
  }

  const filters = {
    q: q || undefined,
    hospital: queryValue(req.query.hospital),
    patient: queryValue(req.query.patient ?? req.query.victim),
    category,
    riskLevel,
    dateFrom: queryValue(req.query.dateFrom),
    dateTo: queryValue(req.query.dateTo),
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 12,
  };

  const hasCaseFilters =
    filters.hospital ||
    filters.patient ||
    filters.category ||
    filters.riskLevel ||
    filters.dateFrom ||
    filters.dateTo;

  if (q && !hasCaseFilters) {
    const grouped = await globalSearch(q, Number(req.query.limit) || 8);
    res.json(grouped);
    return;
  }

  const result = await searchCases(filters);
  res.json(result);
}));

router.get("/search/suggest", asyncHandler(async (req, res) => {
  const ip = getClientIp(req);
  if (!(await rateLimit(`search-suggest:${ip}`, 60)).success) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  const q = String(req.query.q ?? "").trim().slice(0, 200);
  res.json(await searchSuggestions(q));
}));

router.get("/search/filters", asyncHandler(async (_req, res) => {
  const [hospitals, patients] = await Promise.all([
    prisma.hospital.findMany({
      where: { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.patient.findMany({
      where: { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
  ]);
  res.json({ hospitals, patients, victims: patients });
}));

router.get("/stats", asyncHandler(async (_req, res) => {
  res.json(await getPublicStats());
}));

router.get("/cases/recent", asyncHandler(async (req, res) => {
  const limit = Math.min(20, Number(req.query.limit) || 6);
  const cases = await prisma.case.findMany({
    where: PUBLIC_CASE_FILTER,
    take: limit,
    orderBy: [{ riskLevel: "desc" }, { incidentDate: "desc" }],
    select: { ...PUBLIC_CASE_SELECT, ...PUBLIC_CASE_CARD_INCLUDE },
  });
  res.json(cases.map((c) => toPublicCase(c)));
}));

router.get("/cases/slug/:slug", asyncHandler(async (req, res) => {
  const slug = paramValue(req.params.slug);
  const caseRecord = await prisma.case.findFirst({
    where: { slug, ...PUBLIC_CASE_FILTER },
    select: {
      ...PUBLIC_CASE_SELECT,
      ...PUBLIC_CASE_INCLUDE,
      evidence: {
        where: { ...PUBLIC_EVIDENCE_FILTER, ...NOT_DELETED },
        orderBy: { createdAt: "asc" },
        select: PUBLIC_EVIDENCE_SELECT,
      },
    },
  });
  if (!caseRecord) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const withEvidence = {
    ...caseRecord,
    evidence: caseRecord.evidence.map(serializeEvidenceForPublic),
  };
  res.json(toPublicCase(withEvidence));
}));

router.get("/cases/categories", asyncHandler(async (_req, res) => {
  const counts = await prisma.case.groupBy({
    by: ["category"],
    where: PUBLIC_CASE_FILTER,
    _count: true,
  });
  res.json(counts);
}));

router.get("/hospitals", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const hospitalWhere = { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } };
  const [hospitals, total] = await Promise.all([
    prisma.hospital.findMany({
      where: hospitalWhere,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      select: {
        ...PUBLIC_HOSPITAL_SELECT,
        _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } },
      },
    }),
    prisma.hospital.count({ where: hospitalWhere }),
  ]);
  res.json(resJsonPaginated(hospitals, total, page, limit));
}));

router.get("/hospitals/:slug", asyncHandler(async (req, res) => {
  const categoryInput = queryValue(req.query.category);
  const category = categoryInput
    ? caseCategorySchema.safeParse(categoryInput).data
    : undefined;
  const dateFrom = queryValue(req.query.dateFrom);
  const dateTo = queryValue(req.query.dateTo);

  const caseWhere: Prisma.CaseWhereInput = {
    ...PUBLIC_CASE_FILTER,
  };
  if (category) caseWhere.category = category;
  if (dateFrom || dateTo) {
    caseWhere.incidentDate = {};
    if (dateFrom) caseWhere.incidentDate.gte = new Date(dateFrom);
    if (dateTo) caseWhere.incidentDate.lte = new Date(dateTo);
  }

  const hospital = await prisma.hospital.findFirst({
    where: { slug: paramValue(req.params.slug), ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
    select: {
      ...PUBLIC_HOSPITAL_SELECT,
      doctors: { select: { fullName: true, slug: true, specialty: true } },
      cases: {
        where: caseWhere,
        orderBy: [{ riskLevel: "desc" }, { incidentDate: "desc" }],
        select: {
          ...PUBLIC_CASE_SELECT,
          patient: { select: { fullName: true, slug: true, age: true, gender: true } },
          doctor: { select: { fullName: true, slug: true } },
          medication: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!hospital) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const patientMap = new Map<string, { fullName: string; slug: string; caseCount: number }>();
  for (const c of hospital.cases) {
    const p = c.patient;
    const existing = patientMap.get(p.slug);
    if (existing) existing.caseCount++;
    else patientMap.set(p.slug, { fullName: p.fullName, slug: p.slug, caseCount: 1 });
  }

  res.json({
    id: hospital.id,
    name: hospital.name,
    slug: hospital.slug,
    location: hospital.location,
    description: hospital.description,
    createdAt: hospital.createdAt,
    updatedAt: hospital.updatedAt,
    doctors: hospital.doctors,
    cases: hospital.cases.map((c) => toPublicCase(c)),
    totalCases: hospital.cases.length,
    patients: Array.from(patientMap.values()),
    victims: Array.from(patientMap.values()),
  });
}));

async function getPatientProfile(slug: string) {
  const patient = await prisma.patient.findFirst({
    where: { slug, ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
    select: {
      ...PUBLIC_PATIENT_SELECT,
      cases: {
        where: PUBLIC_CASE_FILTER,
        orderBy: { incidentDate: "asc" },
        select: {
          ...PUBLIC_CASE_SELECT,
          hospital: { select: { name: true, slug: true, location: true } },
          doctor: { select: { fullName: true, slug: true } },
          medication: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!patient) return null;
  return toPublicPatientProfile(patient);
}

router.get("/patients", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } };
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
      select: {
        ...PUBLIC_PATIENT_SELECT,
        _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } },
      },
    }),
    prisma.patient.count({ where }),
  ]);
  res.json(resJsonPaginated(patients, total, page, limit));
}));

router.get("/patients/:slug", asyncHandler(async (req, res) => {
  const profile = await getPatientProfile(paramValue(req.params.slug));
  if (!profile) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(profile);
}));

router.get("/victims", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } };
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
      select: {
        ...PUBLIC_PATIENT_SELECT,
        _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } },
      },
    }),
    prisma.patient.count({ where }),
  ]);
  res.json(resJsonPaginated(patients, total, page, limit));
}));

router.get("/victims/:slug", asyncHandler(async (req, res) => {
  const profile = await getPatientProfile(paramValue(req.params.slug));
  if (!profile) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(profile);
}));

router.get("/doctors", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } };
  const [doctors, total] = await Promise.all([
    prisma.doctor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
      include: {
        hospital: { select: { name: true, slug: true } },
        _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } },
      },
    }),
    prisma.doctor.count({ where }),
  ]);
  res.json(resJsonPaginated(doctors, total, page, limit));
}));

router.get("/doctors/:slug", asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findFirst({
    where: { slug: paramValue(req.params.slug), ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
    select: {
      id: true,
      fullName: true,
      slug: true,
      specialty: true,
      createdAt: true,
      updatedAt: true,
      hospital: { select: { name: true, slug: true, location: true } },
      cases: {
        where: PUBLIC_CASE_FILTER,
        orderBy: { incidentDate: "desc" },
        select: {
          ...PUBLIC_CASE_SELECT,
          hospital: { select: { name: true, slug: true } },
          patient: { select: { fullName: true, slug: true } },
        },
      },
    },
  });
  if (!doctor) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toPublicDoctorProfile(doctor));
}));

router.get("/medications", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } };
  const [medications, total] = await Promise.all([
    prisma.medication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } } },
    }),
    prisma.medication.count({ where }),
  ]);
  res.json(resJsonPaginated(medications, total, page, limit));
}));

router.get("/medications/:slug", asyncHandler(async (req, res) => {
  const profile = await getMedicationProfile(paramValue(req.params.slug));
  if (!profile) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(profile);
}));

router.get("/sitemap", asyncHandler(async (_req, res) => {
  const [cases, hospitals, patients, doctors, medications] = await Promise.all([
    prisma.case.findMany({ where: PUBLIC_CASE_FILTER, select: { slug: true, updatedAt: true } }),
    prisma.hospital.findMany({
      where: { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.patient.findMany({
      where: { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.doctor.findMany({
      where: { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.medication.findMany({
      where: { ...NOT_DELETED, cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, updatedAt: true },
    }),
  ]);
  res.json({ cases, hospitals, patients, victims: patients, doctors, medications });
}));

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(5000),
  website: z.string().max(200).optional(),
  startedAt: z.string().optional(),
});

router.post("/contact", asyncHandler(async (req, res) => {
  const ip = getClientIp(req);
  if (!(await rateLimit(`contact:${ip}`, 10)).success) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  try {
    const parsed = contactSchema.parse(req.body);
    const rawFields = [parsed.name, parsed.email, parsed.subject, parsed.message];
    const blocked = rejectUntrustedPublicText(rawFields);
    if (blocked) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: blocked.includes("Invalid") ? "xss_blocked" : "prompt_injection_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "contact" }),
      });
      res.status(400).json({ error: blocked });
      return;
    }
    const data = {
      name: sanitizeUntrustedText(parsed.name),
      email: sanitizeUntrustedText(parsed.email),
      subject: sanitizeUntrustedText(parsed.subject),
      message: sanitizeUntrustedText(parsed.message),
    };
    const startedAt = Number(parsed.startedAt ?? "0");
    const hasStartedAt = Number.isFinite(startedAt) && startedAt > 0;
    const elapsedMs = hasStartedAt ? Date.now() - startedAt : null;
    if (parsed.website?.trim()) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: "bot_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "contact", reason: "honeypot" }),
      });
      res.status(400).json({ error: "Please wait a moment before submitting." });
      return;
    }
    if (hasStartedAt && (elapsedMs! < 800 || elapsedMs! > 24 * 60 * 60 * 1000)) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: "bot_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "contact", elapsedMs }),
      });
      res.status(400).json({ error: "Please wait a moment before submitting." });
      return;
    }
    await prisma.contactMessage.create({ data });
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Please check all fields and try again." });
      return;
    }
    console.error("[contact]", error);
    res.status(400).json({ error: "Invalid request" });
  }
}));

const correctionSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  reportSlug: z.string().max(200).optional(),
  message: z.string().min(10).max(5000),
  website: z.string().max(200).optional(),
  startedAt: z.string().optional(),
});

router.post("/corrections", asyncHandler(async (req, res) => {
  const ip = getClientIp(req);
  if (!(await rateLimit(`corrections:${ip}`, 10)).success) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  try {
    const parsed = correctionSchema.parse(req.body);
    const rawFields = [parsed.name, parsed.email, parsed.reportSlug ?? "", parsed.message];
    const blocked = rejectUntrustedPublicText(rawFields);
    if (blocked) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: blocked.includes("Invalid") ? "xss_blocked" : "prompt_injection_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "corrections" }),
      });
      res.status(400).json({ error: blocked });
      return;
    }
    const data = {
      name: sanitizeUntrustedText(parsed.name),
      email: sanitizeUntrustedText(parsed.email),
      reportSlug: parsed.reportSlug ? sanitizeUntrustedText(parsed.reportSlug) : undefined,
      message: sanitizeUntrustedText(parsed.message),
    };
    const startedAt = Number(parsed.startedAt ?? "0");
    const hasStartedAt = Number.isFinite(startedAt) && startedAt > 0;
    const elapsedMs = hasStartedAt ? Date.now() - startedAt : null;
    if (parsed.website?.trim()) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: "bot_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "corrections", reason: "honeypot" }),
      });
      res.status(400).json({ error: "Please wait a moment before submitting." });
      return;
    }
    if (hasStartedAt && (elapsedMs! < 800 || elapsedMs! > 24 * 60 * 60 * 1000)) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: "bot_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "corrections", elapsedMs }),
      });
      res.status(400).json({ error: "Please wait a moment before submitting." });
      return;
    }
    await prisma.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.reportSlug ? `Correction: ${data.reportSlug}` : "Correction request",
        message: data.message,
      },
    });
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Please check all fields and try again." });
      return;
    }
    console.error("[corrections]", error);
    res.status(400).json({ error: "Invalid request" });
  }
}));

router.post("/case-submissions", (req, res, next) => {
  caseSubmissionUpload.array("evidence", MAX_SUBMISSION_EVIDENCE_FILES)(req, res, (err: unknown) => {
    if (err) {
      res.status(400).json({ error: multerUploadErrorMessage(err) });
      return;
    }
    next();
  });
}, asyncHandler(async (req, res) => {
  const ip = getClientIp(req);
  if (!(await rateLimit(`case-submission:${ip}`, 5)).success) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }

  try {
    const parsed = caseSubmissionSchema.parse(req.body);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const evidenceRequirementError = validateSubmissionEvidenceRequirement(parsed, files.length);
    if (evidenceRequirementError) {
      res.status(400).json({ error: evidenceRequirementError });
      return;
    }

    const botError = rejectPublicFormBot(
      { website: parsed.website, startedAt: parsed.startedAt },
      "case-submissions",
      ip
    );
    if (botError) {
      res.status(400).json({ error: botError });
      return;
    }

    const rawFields = caseSubmissionTextFields(parsed);
    const blocked = rejectUntrustedPublicText(rawFields);
    if (blocked) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: blocked.includes("Invalid") ? "xss_blocked" : "prompt_injection_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "case-submissions" }),
      });
      res.status(400).json({ error: blocked });
      return;
    }

    const weekAgo = new Date(Date.now() - CASE_SUBMISSION_WEEK_MS);
    const recentCount = await prisma.caseSubmission.count({
      where: {
        submitterIp: ip,
        createdAt: { gte: weekAgo },
        ...NOT_DELETED,
      },
    });
    if (recentCount > 0) {
      res.status(429).json({
        error: "Only one case submission is allowed per connection each week. Please try again later.",
      });
      return;
    }

    const incidentDate = new Date(`${parsed.incidentDate}T00:00:00.000Z`);
    if (Number.isNaN(incidentDate.getTime())) {
      res.status(400).json({ error: "Please enter a valid incident date." });
      return;
    }

    const uploadedEvidence = [];
    for (const file of files) {
      const result = await uploadSubmissionEvidenceFile(file);
      if (!result.ok) {
        res.status(400).json({ error: result.error });
        return;
      }
      uploadedEvidence.push(result.data);
    }

    const evidenceNotesRaw = (parsed.evidenceNotes ?? "").trim();

    await prisma.caseSubmission.create({
      data: {
        submitterName: sanitizeUntrustedText(parsed.submitterName),
        submitterEmail: sanitizeUntrustedText(parsed.submitterEmail),
        submitterPhone: parsed.submitterPhone ? sanitizeUntrustedText(parsed.submitterPhone) : null,
        submitterIp: ip,
        title: sanitizeUntrustedText(parsed.title),
        reasonForVisit: sanitizeUntrustedText(parsed.reasonForVisit),
        incidentDescription: sanitizeUntrustedText(parsed.incidentDescription),
        currentCondition: parsed.currentCondition ? sanitizeUntrustedText(parsed.currentCondition) : null,
        whatWentWrong: parsed.whatWentWrong,
        category: parsed.category,
        incidentDate,
        hospitalName: sanitizeUntrustedText(parsed.hospitalName),
        hospitalLocation: parsed.hospitalLocation ? sanitizeUntrustedText(parsed.hospitalLocation) : null,
        patientName: sanitizeUntrustedText(parsed.patientName),
        patientAge: parsed.patientAge ?? null,
        patientGender: parsed.patientGender ?? null,
        doctorName: parsed.doctorName ? sanitizeUntrustedText(parsed.doctorName) : null,
        medicationName: parsed.medicationName ? sanitizeUntrustedText(parsed.medicationName) : null,
        evidenceNotes: evidenceNotesRaw ? sanitizeUntrustedText(evidenceNotesRaw) : "",
        evidence:
          uploadedEvidence.length > 0
            ? {
                create: uploadedEvidence.map((item) => ({
                  type: item.type,
                  url: item.url,
                  publicId: item.publicId,
                  fileName: item.fileName,
                  mimeType: item.mimeType,
                  fileSize: item.fileSize,
                })),
              }
            : undefined,
      },
    });

    res.json({ ok: true, evidenceCount: uploadedEvidence.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "Please check all fields and try again." });
      return;
    }
    console.error("[case-submissions]", error);
    res.status(400).json({ error: "Invalid request" });
  }
}));

export default router;
