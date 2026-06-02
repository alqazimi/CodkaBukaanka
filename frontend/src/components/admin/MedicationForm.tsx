"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary } from "@/components/admin/admin-ui";
import type { MedicationRow } from "@/components/admin/MedicationsManager";

export function MedicationForm({ onCreated }: { onCreated: (medication: MedicationRow) => void }) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [loading, setLoading] = useState(false);
  const toast = useAdminToast();
  const inputClass =
    "w-full rounded-lg border border-navy-200 px-3 py-2 text-sm dark:border-navy-600 dark:bg-navy-900 dark:text-navy-100";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      toast.error("Session expired", "Please sign in again.");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const created = await clientApi.post<MedicationRow>(
        "/api/admin/medications",
        {
          name: form.get("name"),
          type: form.get("type") || undefined,
        },
        token
      );
      if (!created) {
        toast.error("Could not add medication", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Medication added", created.name);
      e.currentTarget.reset();
      onCreated(created);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-surface space-y-3 p-4">
      <h3 className="font-semibold text-navy-900 dark:text-navy-100">Add medication</h3>
      <input name="name" required placeholder="Medication name *" className={inputClass} />
      <input name="type" placeholder="Type (e.g. Antidiabetic)" className={inputClass} />
      <button type="submit" disabled={loading} className={adminBtnPrimary}>
        {loading ? "Adding…" : "Add medication"}
      </button>
    </form>
  );
}
