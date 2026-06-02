"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary } from "@/components/admin/admin-ui";
import type { HospitalRow } from "@/components/admin/HospitalsSection";

function hospitalBodyFromForm(form: FormData) {
  const description = String(form.get("description") ?? "").trim();
  return {
    name: String(form.get("name") ?? "").trim(),
    location: String(form.get("location") ?? "").trim(),
    ...(description ? { description } : { description: "" }),
  };
}

export function HospitalsManager({
  hospitals,
  onUpdated,
  onRemoved,
}: {
  hospitals: HospitalRow[];
  onUpdated: (hospital: HospitalRow) => void;
  onRemoved: (id: string) => void;
}) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(hospital: HospitalRow) {
    if (!token) return;
    const ok = await confirm({
      title: "Delete hospital?",
      description: `"${hospital.name}" will be permanently removed. If this hospital is linked to cases, deletion will be blocked.`,
      confirmLabel: "Delete hospital",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(hospital.id);
    try {
      const result = await clientApi.delete(`/api/admin/hospitals/${hospital.id}`, token);
      if (!result) {
        toast.error("Could not delete hospital", getLastApiError() ?? "It may still be linked to cases.");
        return;
      }
      toast.success("Hospital deleted", hospital.name);
      onRemoved(hospital.id);
    } catch {
      toast.error("Could not delete hospital", "It may still be linked to cases.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8 space-y-3">
      <ul className="admin-surface-list">
        {hospitals.map((h) => (
          <li key={h.id} className="p-4">
            {editingId === h.id ? (
              <HospitalInlineForm
                hospital={h}
                token={token}
                onCancel={() => setEditingId(null)}
                onSaved={(updated) => {
                  setEditingId(null);
                  toast.success("Hospital updated", updated.name);
                  onUpdated(updated);
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-navy-900 dark:text-navy-100">{h.name}</p>
                  <p className="text-sm text-navy-500 dark:text-navy-400">
                    {h.location} · /{h.slug}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEditingId(h.id)} className={adminBtnSecondary}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(h)}
                    disabled={deletingId === h.id}
                    className={adminBtnDanger}
                  >
                    {deletingId === h.id ? "Deleting…" : "Delete"}
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

function HospitalInlineForm({
  hospital,
  token,
  onSaved,
  onCancel,
}: {
  hospital: HospitalRow;
  token?: string;
  onSaved: (hospital: HospitalRow) => void;
  onCancel: () => void;
}) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const inputClass = "w-full min-h-[44px] rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm dark:border-navy-600 dark:bg-navy-900 dark:text-navy-100";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const updated = await clientApi.patch<HospitalRow>(
        `/api/admin/hospitals/${hospital.id}`,
        hospitalBodyFromForm(form),
        token
      );
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
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input name="name" defaultValue={hospital.name} className={inputClass} required />
      <input name="location" defaultValue={hospital.location} className={inputClass} required />
      <textarea
        name="description"
        defaultValue={hospital.description ?? ""}
        className={`${inputClass} sm:col-span-2`}
        rows={2}
      />
      <div className="flex gap-2 sm:col-span-2">
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
