"use client";

import { useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary, adminInputClass } from "@/components/admin/admin-ui";

export type MedicationRow = { id: string; name: string; type?: string | null };

export function MedicationsManager({
  medications,
  onUpdated,
  onRemoved,
}: {
  medications: MedicationRow[];
  onUpdated: (medication: MedicationRow) => void;
  onRemoved: (id: string) => void;
}) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(medication: MedicationRow) {
    const ok = await confirm({
      title: "Delete medication?",
      description: `"${medication.name}" will be moved to the recycle bin. Only the owner can restore or permanently delete it.`,
      confirmLabel: "Delete medication",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(medication.id);
    try {
      const result = await clientApi.delete(`/api/admin/medications/${medication.id}`);
      if (!result) {
        toast.error("Could not delete medication", getLastApiError() ?? "It may still be linked to cases.");
        return;
      }
      toast.success("Medication deleted", medication.name);
      onRemoved(medication.id);
    } catch {
      toast.error("Could not delete medication", "It may still be linked to cases.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="admin-surface-list">
      {medications.map((m) => (
        <li key={m.id} className="p-4">
          {editingId === m.id ? (
            <MedicationInlineForm
              medication={m}
              onCancel={() => setEditingId(null)}
              onSaved={(updated) => {
                setEditingId(null);
                toast.success("Medication updated", updated.name);
                onUpdated(updated);
              }}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="font-semibold text-white">{m.name}</span>
                <p className="text-sm text-muted">{m.type ?? ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditingId(m.id)} className={adminBtnSecondary}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(m)}
                  disabled={deletingId === m.id}
                  className={adminBtnDanger}
                >
                  {deletingId === m.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function MedicationInlineForm({
  medication,
  onSaved,
  onCancel,
}: {
  medication: MedicationRow;
  onSaved: (medication: MedicationRow) => void;
  onCancel: () => void;
}) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const inputClass = adminInputClass;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const updated = await clientApi.patch<MedicationRow>(`/api/admin/medications/${medication.id}`, {
        name: form.get("name"),
        type: form.get("type") || undefined,
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
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input name="name" defaultValue={medication.name} className={inputClass} required />
      <input name="type" defaultValue={medication.type ?? ""} className={inputClass} />
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
