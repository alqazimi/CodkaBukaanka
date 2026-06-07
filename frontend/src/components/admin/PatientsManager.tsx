"use client";

import { useMemo, useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary, adminInputClass } from "@/components/admin/admin-ui";
import type { PatientRow } from "@/components/admin/PatientsSection";

export function PatientsManager({
  patients,
  onUpdated,
  onRemoved,
  isOwner = false,
}: {
  patients: PatientRow[];
  onUpdated: (patient: PatientRow) => void;
  onRemoved: (id: string) => void;
  isOwner?: boolean;
}) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mergeSourceId, setMergeSourceId] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => (p.fullName ?? "").toLowerCase().includes(q));
  }, [patients, search]);

  async function mergeInto(keep: PatientRow) {
    if (!mergeSourceId || mergeSourceId === keep.id) {
      toast.error("Pick a different patient to merge");
      return;
    }
    const ok = await confirm({
      title: "Merge patients?",
      description: `Cases linked to the duplicate will move to "${keep.fullName}".`,
      confirmLabel: "Merge",
      variant: "danger",
    });
    if (!ok) return;
    const res = await clientApi.post<{ ok: boolean }>("/api/admin/patients/merge", {
      keepId: keep.id,
      mergeId: mergeSourceId,
    });
    if (res?.ok) {
      toast.success("Patients merged");
      onRemoved(mergeSourceId);
      setMergeSourceId("");
    } else {
      toast.error("Merge failed", getLastApiError() ?? "Please try again.");
    }
  }

  async function onDelete(patient: PatientRow) {
    const ok = await confirm({
      title: "Delete patient?",
      description: `"${patient.fullName}" will be moved to the recycle bin. Only the owner can restore or permanently delete it.`,
      confirmLabel: "Delete patient",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(patient.id);
    try {
      const result = await clientApi.delete(`/api/admin/patients/${patient.id}`);
      if (!result) {
        toast.error("Could not delete patient", getLastApiError() ?? "It may still be linked to cases.");
        return;
      }
      toast.success("Patient deleted", patient.fullName);
      onRemoved(patient.id);
    } catch {
      toast.error("Could not delete patient", "It may still be linked to cases.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search patients…"
        className={adminInputClass}
      />
      {isOwner && (
        <select value={mergeSourceId} onChange={(e) => setMergeSourceId(e.target.value)} className={adminInputClass}>
          <option value="">Select duplicate patient to merge…</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>
      )}
      <ul className="admin-surface-list">
        {filtered.map((p) => (
        <li key={p.id} className="p-4">
          {editingId === p.id ? (
            <PatientInlineForm
              patient={p}
              onCancel={() => setEditingId(null)}
              onSaved={(updated) => {
                setEditingId(null);
                toast.success("Patient updated", updated.fullName);
                onUpdated(updated);
              }}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="font-semibold text-white">{p.fullName}</span>
                <p className="text-sm text-muted">
                  {[p.age && `Age ${p.age}`, p.gender].filter(Boolean).join(" · ")}
                  {p._count ? ` · ${p._count.cases} cases` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {isOwner && mergeSourceId && mergeSourceId !== p.id && (
                  <button type="button" onClick={() => mergeInto(p)} className={adminBtnSecondary}>
                    Merge here
                  </button>
                )}
                <button type="button" onClick={() => setEditingId(p.id)} className={adminBtnSecondary}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p)}
                  disabled={deletingId === p.id}
                  className={adminBtnDanger}
                >
                  {deletingId === p.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
    </div>
  );
}

function PatientInlineForm({
  patient,
  onSaved,
  onCancel,
}: {
  patient: PatientRow;
  onSaved: (patient: PatientRow) => void;
  onCancel: () => void;
}) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const inputClass = adminInputClass;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const ageRaw = form.get("age");
    try {
      const updated = await clientApi.patch<PatientRow>(`/api/admin/patients/${patient.id}`, {
        fullName: form.get("fullName"),
        age: ageRaw ? Number(ageRaw) : undefined,
        gender: form.get("gender") || undefined,
      });
      if (!updated) {
        toast.error("Update failed", getLastApiError() ?? "Please try again.");
        setLoading(false);
        return;
      }
      onSaved(updated);
    } catch {
      toast.error("Update failed", getLastApiError() ?? "Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
      <input name="fullName" defaultValue={patient.fullName} className={`${inputClass} sm:col-span-2`} required />
      <input name="age" type="number" defaultValue={patient.age ?? ""} className={inputClass} />
      <input name="gender" defaultValue={patient.gender ?? ""} className={`${inputClass} sm:col-span-2`} />
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={loading} className={adminBtnPrimary}>
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className={adminBtnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
