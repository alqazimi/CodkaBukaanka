"use client";

import { useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary, adminInputClass, adminSubheading } from "@/components/admin/admin-ui";
import type { MedicationRow } from "@/components/admin/MedicationsManager";

export function MedicationForm({ onCreated }: { onCreated: (medication: MedicationRow) => void }) {
  const [loading, setLoading] = useState(false);
  const toast = useAdminToast();
  const inputClass = adminInputClass;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    const form = new FormData(formEl);
    try {
      const created = await clientApi.post<MedicationRow>("/api/admin/medications", {
        name: form.get("name"),
        type: form.get("type") || undefined,
      });
      if (!created) {
        toast.error("Could not add medication", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Medication added", created.name);
      formEl.reset();
      onCreated(created);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-surface space-y-3 p-4">
      <h3 className={adminSubheading}>Add medication</h3>
      <input name="name" required placeholder="Medication name *" className={inputClass} />
      <input name="type" placeholder="Type (e.g. Antidiabetic)" className={inputClass} />
      <button type="submit" disabled={loading} className={adminBtnPrimary}>
        {loading ? "Adding…" : "Add medication"}
      </button>
    </form>
  );
}
