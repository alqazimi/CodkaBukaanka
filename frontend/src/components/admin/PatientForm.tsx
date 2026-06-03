"use client";

import { useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary } from "@/components/admin/admin-ui";
import type { PatientRow } from "@/components/admin/PatientsSection";

export function PatientForm({ onCreated }: { onCreated: (patient: PatientRow) => void }) {
  const [loading, setLoading] = useState(false);
  const toast = useAdminToast();
  const inputClass =
    "w-full rounded-lg border border-navy-200 px-3 py-2 text-sm dark:border-navy-600 dark:bg-navy-900 dark:text-navy-100";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    const form = new FormData(formEl);
    const ageRaw = form.get("age");
    try {
      const created = await clientApi.post<PatientRow>("/api/admin/patients", {
        fullName: form.get("fullName"),
        age: ageRaw ? Number(ageRaw) : undefined,
        gender: form.get("gender") || undefined,
      });
      if (!created) {
        toast.error("Could not add patient", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Patient added", created.fullName);
      formEl.reset();
      onCreated(created);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-surface space-y-3 p-4">
      <h3 className="font-semibold text-navy-900 dark:text-navy-100">Add patient</h3>
      <input name="fullName" required placeholder="Full name *" className={inputClass} />
      <div className="grid grid-cols-2 gap-3">
        <input name="age" type="number" placeholder="Age" className={inputClass} />
        <input name="gender" placeholder="Gender" className={inputClass} />
      </div>
      <button type="submit" disabled={loading} className={adminBtnPrimary}>
        {loading ? "Adding…" : "Add patient"}
      </button>
    </form>
  );
}
