import { Router } from "express";
import { existsSync } from "node:fs";
import { asyncHandler } from "../lib/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { resolveLocalUploadPath } from "../lib/local-upload.js";
import {
  globalSearch,
  searchSuggestions,
  searchCases,
  getPublicStats,
  getMedicationProfile,
} from "../lib/search.js";
import { PUBLIC_CASE_FILTER } from "../lib/constants.js";
import { rateLimit, getClientIp } from "../lib/rate-limit.js";
import { parsePagination, paginationMeta } from "../lib/pagination.js";
import { caseCategorySchema, riskLevelSchema } from "../lib/schemas.js";
import { hasPromptInjectionPayload, normalizeUntrustedText } from "../lib/prompt-guard.js";
import { logAudit } from "../lib/audit.js";
import { z } from "zod";
import type { CaseCategory, RiskLevel } from "@prisma/client";
import type { Prisma } from "@prisma/client";

const router = Router();

/** Dev-only local evidence files (when Cloudinary is unavailable). */
router.get("/uploads/:filename", asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const filePath = resolveLocalUploadPath(paramValue(req.params.filename));
  if (!filePath || !existsSync(filePath)) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.sendFile(filePath);
}));

const PUBLIC_EVIDENCE_FILTER = { visibility: "PUBLIC" as const };

function paramValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

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
      where: { cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.patient.findMany({
      where: { cases: { some: PUBLIC_CASE_FILTER } },
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
    include: {
      hospital: { select: { name: true, slug: true } },
      patient: { select: { fullName: true, slug: true } },
      doctor: { select: { fullName: true, slug: true } },
      medication: { select: { name: true, slug: true } },
    },
  });
  res.json(cases);
}));

router.get("/cases/slug/:slug", asyncHandler(async (req, res) => {
  const slug = paramValue(req.params.slug);
  const caseRecord = await prisma.case.findFirst({
    where: { slug, ...PUBLIC_CASE_FILTER },
    include: {
      hospital: true,
      patient: true,
      doctor: true,
      medication: true,
      evidence: {
        where: PUBLIC_EVIDENCE_FILTER,
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!caseRecord) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const { authorId, ...publicCase } = caseRecord;
  void authorId;
  res.json(publicCase);
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
  const [hospitals, total] = await Promise.all([
    prisma.hospital.findMany({
      skip,
      take: limit,
      orderBy: { name: "asc" },
      include: { _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } } },
    }),
    prisma.hospital.count(),
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

  const hospital = await prisma.hospital.findUnique({
    where: { slug: paramValue(req.params.slug) },
    include: {
      doctors: { select: { fullName: true, slug: true, specialty: true } },
      cases: {
        where: caseWhere,
        orderBy: [{ riskLevel: "desc" }, { incidentDate: "desc" }],
        include: {
          hospital: { select: { name: true, slug: true } },
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
    ...hospital,
    totalCases: hospital.cases.length,
    patients: Array.from(patientMap.values()),
    victims: Array.from(patientMap.values()),
  });
}));

async function getPatientProfile(slug: string) {
  const patient = await prisma.patient.findUnique({
    where: { slug },
    include: {
      cases: {
        where: PUBLIC_CASE_FILTER,
        orderBy: { incidentDate: "asc" },
        include: {
          hospital: { select: { name: true, slug: true, location: true } },
          doctor: { select: { fullName: true, slug: true } },
          medication: { select: { name: true, slug: true } },
        },
      },
    },
  });

  if (!patient) return null;

  const hospitals = [...new Map(patient.cases.map((c) => [c.hospital.slug, c.hospital])).values()];

  return {
    ...patient,
    totalCases: patient.cases.length,
    hospitals,
    timeline: patient.cases.map((c) => ({
      id: c.id,
      slug: c.slug,
      caseNumber: c.caseNumber,
      title: c.title,
      category: c.category,
      riskLevel: c.riskLevel,
      whatWentWrong: c.whatWentWrong,
      status: c.status,
      incidentDate: c.incidentDate,
      hospital: c.hospital,
      doctor: c.doctor,
      medication: c.medication,
    })),
  };
}

router.get("/patients", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { cases: { some: PUBLIC_CASE_FILTER } };
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
      include: { _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } } },
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
  const where = { cases: { some: PUBLIC_CASE_FILTER } };
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      skip,
      take: limit,
      orderBy: { fullName: "asc" },
      include: { _count: { select: { cases: { where: PUBLIC_CASE_FILTER } } } },
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
  const where = { cases: { some: PUBLIC_CASE_FILTER } };
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
  const doctor = await prisma.doctor.findUnique({
    where: { slug: paramValue(req.params.slug) },
    include: {
      hospital: true,
      cases: {
        where: PUBLIC_CASE_FILTER,
        orderBy: { incidentDate: "desc" },
        include: {
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
  res.json({ ...doctor, totalCases: doctor.cases.length });
}));

router.get("/medications", asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const where = { cases: { some: PUBLIC_CASE_FILTER } };
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
      where: { cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.patient.findMany({
      where: { cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.doctor.findMany({
      where: { cases: { some: PUBLIC_CASE_FILTER } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.medication.findMany({
      where: { cases: { some: PUBLIC_CASE_FILTER } },
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
    const data = {
      name: normalizeUntrustedText(parsed.name),
      email: normalizeUntrustedText(parsed.email),
      subject: normalizeUntrustedText(parsed.subject),
      message: normalizeUntrustedText(parsed.message),
    };
    const startedAt = Number(parsed.startedAt ?? "0");
    const elapsedMs = Number.isFinite(startedAt) && startedAt > 0 ? Date.now() - startedAt : 0;
    if (parsed.website || elapsedMs < 1500 || elapsedMs > 24 * 60 * 60 * 1000) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: "bot_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "contact", elapsedMs }),
      });
      res.status(400).json({ error: "Spam protection triggered" });
      return;
    }
    if (hasPromptInjectionPayload([data.subject, data.message])) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: "prompt_injection_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "contact" }),
      });
      res.status(400).json({ error: "Suspicious content blocked" });
      return;
    }
    await prisma.contactMessage.create({ data });
    res.json({ ok: true });
  } catch {
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
    const data = {
      name: normalizeUntrustedText(parsed.name),
      email: normalizeUntrustedText(parsed.email),
      reportSlug: parsed.reportSlug ? normalizeUntrustedText(parsed.reportSlug) : undefined,
      message: normalizeUntrustedText(parsed.message),
    };
    const startedAt = Number(parsed.startedAt ?? "0");
    const elapsedMs = Number.isFinite(startedAt) && startedAt > 0 ? Date.now() - startedAt : 0;
    if (parsed.website || elapsedMs < 1500 || elapsedMs > 24 * 60 * 60 * 1000) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: "bot_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "corrections", elapsedMs }),
      });
      res.status(400).json({ error: "Spam protection triggered" });
      return;
    }
    if (hasPromptInjectionPayload([data.reportSlug ?? "", data.message])) {
      await logAudit({
        action: "LOGIN_FAILED",
        entityType: "prompt_injection_blocked",
        ipAddress: ip,
        details: JSON.stringify({ endpoint: "corrections" }),
      });
      res.status(400).json({ error: "Suspicious content blocked" });
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
  } catch {
    res.status(400).json({ error: "Invalid request" });
  }
}));

export default router;
