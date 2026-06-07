"use client";

import { useMemo, useRef, useState } from "react";
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
import { getSelectableCaseStatuses } from "@/lib/case-status";
import { clientApi } from "@/lib/api";
import { countEphemeralLocalEvidence } from "@/lib/evidence-storage";
import { navigateAdmin } from "@/lib/admin-router";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary, adminInputClass, adminTextMuted } from "@/components/admin/admin-ui";
import { EvidenceUpload } from "@/components/admin/EvidenceUpload";
import { PublishChecklistModal } from "@/components/admin/PublishChecklistModal";
import { QuickAddEntityModal } from "@/components/admin/QuickAddEntityModal";
import type { CaseCategory, CaseStatus, EvidenceLevel, RiskLevel, EvidenceItem } from "@/types/entities";

type Option = { id: string; name?: string; fullName?: string; location?: string; age?: number | null };

const WORKFLOW_STEPS: CaseStatus[] = ["DRAFT", "UNDER_REVIEW", "VERIFIED", "PUBLISHED"];

function formatDateInput(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

export function CaseForm({
  hospitals: initialHospitals,
  patients: initialPatients,
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
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [quickAdd, setQuickAdd] = useState<"hospital" | "patient" | null>(null);
  const [hospitals, setHospitals] = useState(initialHospitals);
  const [patients, setPatients] = useState(initialPatients);
  const [evidenceItems, setEvidenceItems] = useState(evidence);
  const toast = useAdminToast();
  const i = initial ?? {};
  const inputClass = adminInputClass;
  const currentStatus = (i.status as CaseStatus | undefined) ?? "DRAFT";
  const selectableStatuses = useMemo(
    () => getSelectableCaseStatuses(currentStatus, !caseId),
    [currentStatus, caseId]
  );

  const publicEvidenceCount = evidenceItems.filter((e) => e.visibility === "PUBLIC").length;
  const staleEvidenceCount = useMemo(() => countEphemeralLocalEvidence(evidenceItems), [evidenceItems]);

  async function saveForm(form: HTMLFormElement) {
    setLoading(true);
    const data = new FormData(form);
    const payload = {
      title: data.get("title"),
      reasonForVisit: data.get("reasonForVisit"),
      incidentDescription: data.get("incidentDescription"),
      currentCondition: data.get("currentCondition") || undefined,
      internalNotes: data.get("internalNotes") || null,
      whatWentWrong: data.get("whatWentWrong"),
      category: data.get("category"),
      status: data.get("status"),
      riskLevel: data.get("riskLevel"),
      evidenceLevel: data.get("evidenceLevel"),
      incidentDate: data.get("incidentDate"),
      hospitalId: data.get("hospitalId"),
      patientId: data.get("patientId"),
      doctorId: data.get("doctorId") || null,
      medicationId: data.get("medicationId") || null,
    };

    const result = caseId
      ? await clientApi.patch<{ id: string }>(`/api/admin/cases/${caseId}`, payload)
      : await clientApi.post<{ id: string }>("/api/admin/cases", payload);

    if (!result?.id) {
      toast.error("Could not save case", "Please check required fields and try again.");
      setLoading(false);
      return false;
    }

    if (caseId) {
      toast.success("Case updated");
      setLoading(false);
      return true;
    }

    toast.success("Case created");
    navigateAdmin(`/admin/cases/${result.id}`);
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const nextStatus = String(new FormData(form).get("status"));

    if (caseId && nextStatus === "PUBLISHED" && currentStatus !== "PUBLISHED") {
      setShowPublishModal(true);
      return;
    }

    await saveForm(form);
  }

  const publishChecks = useMemo(() => {
    const form = formRef.current;
    if (!form) {
      return [
        { label: "Form loaded", ok: true },
      ];
    }
    const data = new FormData(form);
    return [
      { label: "Title provided", ok: Boolean(String(data.get("title") ?? "").trim()) },
      { label: "Hospital selected", ok: Boolean(String(data.get("hospitalId") ?? "")) },
      { label: "Patient selected", ok: Boolean(String(data.get("patientId") ?? "")) },
      { label: "Incident description provided", ok: Boolean(String(data.get("incidentDescription") ?? "").trim()) },
      { label: "At least one public evidence file", ok: publicEvidenceCount > 0 },
      { label: "Evidence re-uploaded (no temporary-disk files)", ok: staleEvidenceCount === 0 },
    ];
  }, [publicEvidenceCount, staleEvidenceCount, formRef]);

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-4xl space-y-5 sm:space-y-6">
        {Boolean(i.caseNumber) && (
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-muted">
            Case number: {String(i.caseNumber)}
          </p>
        )}

        {caseId && (
          <div className="card-surface p-4 sm:p-5">
            <p className={adminTextMuted}>Workflow</p>
            <ol className="mt-3 flex flex-wrap gap-2">
              {WORKFLOW_STEPS.map((step) => (
                <li
                  key={step}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    step === currentStatus
                      ? "bg-red-600/70 text-white"
                      : WORKFLOW_STEPS.indexOf(step) < WORKFLOW_STEPS.indexOf(currentStatus)
                        ? "bg-red-950/40 text-red-200"
                        : "bg-white/10 text-muted"
                  }`}
                >
                  {STATUS_LABELS[step].en}
                </li>
              ))}
            </ol>
          </div>
        )}

        <section className="card-surface space-y-4 p-5 sm:p-6">
          <h3 className="font-serif text-xl font-bold tracking-tight text-white">Case narrative</h3>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-white/85">Case title</span>
            <input name="title" required defaultValue={String(i.title ?? "")} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-white/85">Reason for visit</span>
            <input name="reasonForVisit" required defaultValue={String(i.reasonForVisit ?? "")} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-white/85">Incident description</span>
            <textarea name="incidentDescription" required rows={7} defaultValue={String(i.incidentDescription ?? "")} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-white/85">Current condition</span>
            <textarea name="currentCondition" rows={3} defaultValue={String(i.currentCondition ?? "")} className={inputClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-white/85">Internal notes (not public)</span>
            <textarea
              name="internalNotes"
              rows={3}
              placeholder="Reviewer notes — never shown on the public site"
              defaultValue={String(i.internalNotes ?? "")}
              className={inputClass}
            />
          </label>
        </section>

        <section className="card-surface space-y-4 p-5 sm:p-6">
          <h3 className="font-serif text-xl font-bold tracking-tight text-white">Classification</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-white/85">What went wrong</span>
              <select name="whatWentWrong" required defaultValue={String(i.whatWentWrong ?? "OTHER")} className={inputClass}>
                {WHAT_WENT_WRONG.map((w) => (
                  <option key={w} value={w}>{WHAT_WENT_WRONG_LABELS[w].en}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-white/85">Category</span>
              <select name="category" required defaultValue={String(i.category ?? "OTHER")} className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c as CaseCategory].en}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-white/85">Status</span>
              <select name="status" required defaultValue={String(i.status ?? "DRAFT")} className={inputClass}>
                {selectableStatuses.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s].en}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-white/85">Risk level</span>
              <select name="riskLevel" required defaultValue={String(i.riskLevel ?? "MEDIUM")} className={inputClass}>
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>{RISK_LEVEL_LABELS[r as RiskLevel].en}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-white/85">Evidence level</span>
              <select name="evidenceLevel" required defaultValue={String(i.evidenceLevel ?? "LOW")} className={inputClass}>
                {(Object.keys(EVIDENCE_LEVEL_LABELS) as EvidenceLevel[]).map((l) => (
                  <option key={l} value={l}>{EVIDENCE_LEVEL_LABELS[l].en}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-white/85">Incident date</span>
            <input
              name="incidentDate"
              type="date"
              required
              defaultValue={formatDateInput(i.incidentDate)}
              className={inputClass}
            />
          </label>
        </section>

        <section className="card-surface space-y-4 p-5 sm:p-6">
          <h3 className="font-serif text-xl font-bold tracking-tight text-white">Linked entities</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white/85">Hospital</span>
                <button type="button" onClick={() => setQuickAdd("hospital")} className="link-theme text-xs font-medium">
                  + Add new
                </button>
              </div>
              <select name="hospitalId" required defaultValue={String(i.hospitalId ?? "")} className={inputClass}>
                <option value="">Select hospital *</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                    {h.location ? ` · ${h.location}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white/85">Patient</span>
                <button type="button" onClick={() => setQuickAdd("patient")} className="link-theme text-xs font-medium">
                  + Add new
                </button>
              </div>
              <select name="patientId" required defaultValue={String(i.patientId ?? i.victimId ?? "")} className={inputClass}>
                <option value="">Select patient *</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                    {p.age != null ? ` · Age ${p.age}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-white/85">Doctor (optional)</span>
              <select name="doctorId" defaultValue={String(i.doctorId ?? "")} className={inputClass}>
                <option value="">Doctor (optional)</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.fullName}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-white/85">Medication (optional)</span>
              <select name="medicationId" defaultValue={String(i.medicationId ?? "")} className={inputClass}>
                <option value="">Medication (optional)</option>
                {medications.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {caseId && (
          <section className="card-surface p-5 sm:p-6">
            <h3 className="mb-4 font-serif text-xl font-bold tracking-tight text-white">Evidence assets</h3>
            <EvidenceUpload caseId={caseId} existing={evidenceItems} onChange={setEvidenceItems} />
          </section>
        )}

        <button
          type="submit"
          disabled={loading}
          className={adminBtnPrimary}
        >
          {loading ? "Saving..." : caseId ? "Update Case" : "Create Case"}
        </button>
      </form>

      <PublishChecklistModal
        open={showPublishModal}
        checks={publishChecks}
        onCancel={() => setShowPublishModal(false)}
        onConfirm={async () => {
          setShowPublishModal(false);
          if (formRef.current) await saveForm(formRef.current);
        }}
      />

      <QuickAddEntityModal
        kind={quickAdd ?? "hospital"}
        open={quickAdd !== null}
        onClose={() => setQuickAdd(null)}
        onCreated={(item) => {
          if (quickAdd === "hospital" && item.name) {
            setHospitals((prev) => [...prev, item].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")));
          }
          if (quickAdd === "patient" && item.fullName) {
            setPatients((prev) => [...prev, item].sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "")));
          }
        }}
      />
    </>
  );
}
