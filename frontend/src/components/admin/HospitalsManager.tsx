"use client";

import { useMemo, useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary, adminInputClass } from "@/components/admin/admin-ui";
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
  isOwner = false,
}: {
  hospitals: HospitalRow[];
  onUpdated: (hospital: HospitalRow) => void;
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
    if (!q) return hospitals;
    return hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        (h.location ?? "").toLowerCase().includes(q) ||
        h.slug.includes(q)
    );
  }, [hospitals, search]);

  async function mergeInto(keep: HospitalRow) {
    if (!mergeSourceId || mergeSourceId === keep.id) {
      toast.error("Pick a different hospital to merge");
      return;
    }
    const ok = await confirm({
      title: "Merge hospitals?",
      description: `Cases and doctors from the selected hospital will move to "${keep.name}". The duplicate will be deleted.`,
      confirmLabel: "Merge",
      variant: "danger",
    });
    if (!ok) return;
    const res = await clientApi.post<{ ok: boolean }>("/api/admin/hospitals/merge", {
      keepId: keep.id,
      mergeId: mergeSourceId,
    });
    if (res?.ok) {
      toast.success("Hospitals merged");
      onRemoved(mergeSourceId);
      setMergeSourceId("");
    } else {
      toast.error("Merge failed", getLastApiError() ?? "Please try again.");
    }
  }

  async function onDelete(hospital: HospitalRow) {
    const ok = await confirm({
      title: "Delete hospital?",
      description: `"${hospital.name}" will be moved to the recycle bin. Only the owner can restore or permanently delete it.`,
      confirmLabel: "Delete hospital",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(hospital.id);
    try {
      const result = await clientApi.delete(`/api/admin/hospitals/${hospital.id}`);
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
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search hospitals…"
        className={adminInputClass}
      />
      {isOwner && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm text-navy-600">Merge duplicate into selected row:</label>
          <select value={mergeSourceId} onChange={(e) => setMergeSourceId(e.target.value)} className={adminInputClass}>
            <option value="">Select duplicate hospital…</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <ul className="admin-surface-list">
        {filtered.map((h) => (
          <li key={h.id} className="p-4">
            {editingId === h.id ? (
              <HospitalInlineForm
                hospital={h}
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
                    {h._count ? ` · ${h._count.cases} cases` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {isOwner && mergeSourceId && mergeSourceId !== h.id && (
                    <button type="button" onClick={() => mergeInto(h)} className={adminBtnSecondary}>
                      Merge here
                    </button>
                  )}
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
  onSaved,
  onCancel,
}: {
  hospital: HospitalRow;
  onSaved: (hospital: HospitalRow) => void;
  onCancel: () => void;
}) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const inputClass = "w-full min-h-[44px] rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm dark:border-navy-600 dark:bg-navy-900 dark:text-navy-100";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const updated = await clientApi.patch<HospitalRow>(
        `/api/admin/hospitals/${hospital.id}`,
        hospitalBodyFromForm(form)
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
