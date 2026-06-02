"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi, getLastApiError } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary } from "@/components/admin/admin-ui";

type Patient = { id: string; fullName: string; age?: number | null; gender?: string | null };

export function PatientsManager({ patients }: { patients: Patient[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(patient: Patient) {
    if (!token) return;
    const ok = await confirm({
      title: "Delete patient?",
      description: `"${patient.fullName}" will be permanently removed. Patients linked to cases cannot be deleted.`,
      confirmLabel: "Delete patient",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(patient.id);
    try {
      const result = await clientApi.delete(`/api/admin/patients/${patient.id}`, token);
      if (!result) {
        toast.error("Could not delete patient", getLastApiError() ?? "It may still be linked to cases.");
        return;
      }
      toast.success("Patient deleted", patient.fullName);
      refreshAdminPage(router);
    } catch {
      toast.error("Could not delete patient", "It may still be linked to cases.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="admin-surface-list">
      {patients.map((p) => (
        <li key={p.id} className="p-4">
          {editingId === p.id ? (
            <PatientInlineForm
              patient={p}
              token={token}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                toast.success("Patient updated", p.fullName);
                refreshAdminPage(router);
              }}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="font-medium text-navy-900">{p.fullName}</span>
                <p className="text-sm text-navy-500">{[p.age && `Age ${p.age}`, p.gender].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
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
  );
}

function PatientInlineForm({
  patient,
  token,
  onSaved,
  onCancel,
}: {
  patient: Patient;
  token?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const inputClass = "w-full min-h-[44px] rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const updated = await clientApi.patch(
        `/api/admin/patients/${patient.id}`,
        {
          fullName: form.get("fullName"),
          age: form.get("age") || undefined,
          gender: form.get("gender") || undefined,
        },
        token
      );
      if (!updated) {
        toast.error("Update failed", getLastApiError() ?? "Please try again.");
        setLoading(false);
        return;
      }
      onSaved();
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
