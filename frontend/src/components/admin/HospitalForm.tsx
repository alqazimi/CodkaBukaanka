"use client";

import { useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary, adminInputClass } from "@/components/admin/admin-ui";
import type { HospitalRow } from "@/components/admin/HospitalsSection";

export function HospitalForm({ onCreated }: { onCreated: (hospital: HospitalRow) => void }) {
  const [loading, setLoading] = useState(false);
  const toast = useAdminToast();
  const inputClass = adminInputClass;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    setLoading(true);
    const form = new FormData(formEl);
    const description = String(form.get("description") ?? "").trim();
    try {
      const created = await clientApi.post<HospitalRow>("/api/admin/hospitals", {
        name: String(form.get("name") ?? "").trim(),
        location: String(form.get("location") ?? "").trim(),
        ...(description ? { description } : {}),
      });
      if (!created) {
        toast.error("Could not add hospital", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Hospital added", created.name);
      formEl.reset();
      onCreated(created);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input name="name" placeholder="Hospital name *" required className={inputClass} />
      <input name="location" placeholder="Location *" required className={inputClass} />
      <textarea name="description" placeholder="Description" rows={2} className={`${inputClass} sm:col-span-2`} />
      <button type="submit" disabled={loading} className={`${adminBtnPrimary} sm:col-span-2`}>
        {loading ? "Adding…" : "Add hospital"}
      </button>
    </form>
  );
}
