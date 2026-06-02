"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  STATUS_LABELS,
  WHAT_WENT_WRONG,
  WHAT_WENT_WRONG_LABELS,
  EVIDENCE_LEVEL_LABELS,
  RISK_LEVELS,
  RISK_LEVEL_LABELS,
} from "@/lib/constants";
import { clientApi } from "@/lib/api";
import { navigateAdmin, refreshAdminPage } from "@/lib/admin-router";
import { EvidenceUpload } from "@/components/admin/EvidenceUpload";
import type { CaseCategory, CaseStatus, WhatWentWrong, EvidenceLevel, RiskLevel, EvidenceItem } from "@/types/entities";

type Option = { id: string; name?: string; fullName?: string };

export function CaseForm({
  hospitals,
  patients,
  doctors,
  medications,
  initial,
  caseId,
  evidence = [],
}: {
  hospitals: Option[];
  patients: Option[];
  doctors: Option[];
  medications: Option[];
  initial?: Record<string, unknown>;
  caseId?: string;
  evidence?: EvidenceItem[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const i = initial ?? {};
  const inputClass = "w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      title: form.get("title"),
      reasonForVisit: form.get("reasonForVisit"),
      incidentDescription: form.get("incidentDescription"),
      currentCondition: form.get("currentCondition") || undefined,
      whatWentWrong: form.get("whatWentWrong"),
      category: form.get("category"),
      status: form.get("status"),
      riskLevel: form.get("riskLevel"),
      evidenceLevel: form.get("evidenceLevel"),
      incidentDate: form.get("incidentDate"),
      hospitalId: form.get("hospitalId"),
      patientId: form.get("patientId"),
      doctorId: form.get("doctorId") || null,
      medicationId: form.get("medicationId") || null,
    };
    try {
      const data = caseId
        ? await clientApi.patch<{ id: string }>(`/api/admin/cases/${caseId}`, payload, token)
        : await clientApi.post<{ id: string }>("/api/admin/cases", payload, token);
      if (!data?.id) {
        setError("Failed to save");
        setLoading(false);
        return;
      }
      if (caseId) {
        refreshAdminPage(router);
        setLoading(false);
      } else {
        navigateAdmin(`/admin/cases/${data.id}`);
      }
    } catch {
      setError("Failed to save");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl space-y-5 sm:space-y-6">
      {Boolean(i.caseNumber) && (
        <p className="inline-flex rounded-full bg-navy-100 px-3 py-1 font-mono text-xs text-navy-600">Case number: {String(i.caseNumber)}</p>
      )}
      <section className="card-surface space-y-4 p-5 sm:p-6">
        <h3 className="font-serif text-xl font-semibold tracking-tight text-navy-900">Case narrative</h3>
        <input name="title" required placeholder="Case title *" defaultValue={String(i.title ?? "")} className={inputClass} />
        <input name="reasonForVisit" required placeholder="Reason for visit *" defaultValue={String(i.reasonForVisit ?? "")} className={inputClass} />
        <textarea name="incidentDescription" required rows={7} placeholder="Incident description *" defaultValue={String(i.incidentDescription ?? "")} className={inputClass} />
        <textarea name="currentCondition" rows={3} placeholder="Current condition" defaultValue={String(i.currentCondition ?? "")} className={inputClass} />
      </section>

      <section className="card-surface space-y-4 p-5 sm:p-6">
        <h3 className="font-serif text-xl font-semibold tracking-tight text-navy-900">Classification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
        <select name="whatWentWrong" required defaultValue={String(i.whatWentWrong ?? "OTHER")} className={inputClass}>
          {WHAT_WENT_WRONG.map((w) => (
            <option key={w} value={w}>{WHAT_WENT_WRONG_LABELS[w].en}</option>
          ))}
        </select>
        <select name="category" required defaultValue={String(i.category ?? "OTHER")} className={inputClass}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c].en}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <select name="status" required defaultValue={String(i.status ?? "DRAFT")} className={inputClass}>
          {(Object.keys(STATUS_LABELS) as CaseStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s].en}</option>
          ))}
        </select>
        <select name="riskLevel" required defaultValue={String(i.riskLevel ?? "MEDIUM")} className={inputClass}>
          {RISK_LEVELS.map((r) => (
            <option key={r} value={r}>{RISK_LEVEL_LABELS[r as RiskLevel].en}</option>
          ))}
        </select>
        <select name="evidenceLevel" required defaultValue={String(i.evidenceLevel ?? "LOW")} className={inputClass}>
          {(Object.keys(EVIDENCE_LEVEL_LABELS) as EvidenceLevel[]).map((l) => (
            <option key={l} value={l}>{EVIDENCE_LEVEL_LABELS[l].en}</option>
          ))}
        </select>
      </div>
      <input name="incidentDate" type="date" required defaultValue={i.incidentDate ? new Date(String(i.incidentDate)).toISOString().split("T")[0] : ""} className={inputClass} />
      </section>

      <section className="card-surface space-y-4 p-5 sm:p-6">
        <h3 className="font-serif text-xl font-semibold tracking-tight text-navy-900">Linked entities</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <select name="hospitalId" required defaultValue={String(i.hospitalId ?? "")} className={inputClass}>
          <option value="">Select hospital *</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        <select name="patientId" required defaultValue={String(i.patientId ?? i.victimId ?? "")} className={inputClass}>
          <option value="">Select patient *</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <select name="doctorId" defaultValue={String(i.doctorId ?? "")} className={inputClass}>
          <option value="">Doctor (optional)</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.fullName}</option>
          ))}
        </select>
        <select name="medicationId" defaultValue={String(i.medicationId ?? "")} className={inputClass}>
          <option value="">Medication (optional)</option>
          {medications.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      </section>
      {caseId && token && (
        <section className="card-surface p-5 sm:p-6">
          <h3 className="mb-4 font-serif text-xl font-semibold tracking-tight text-navy-900">Evidence assets</h3>
          <EvidenceUpload caseId={caseId} token={token} existing={evidence} />
        </section>
      )}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50">
        {loading ? "Saving..." : caseId ? "Update Case" : "Create Case"}
      </button>
    </form>
  );
}
