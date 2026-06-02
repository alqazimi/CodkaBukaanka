"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary } from "@/components/admin/admin-ui";
import type { DoctorRow } from "@/components/admin/DoctorsManager";

export function DoctorForm({
  hospitals,
  onCreated,
}: {
  hospitals: { id: string; name: string }[];
  onCreated: (doctor: DoctorRow) => void;
}) {
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
    const hospitalId = String(form.get("hospitalId") ?? "");
    try {
      const created = await clientApi.post<DoctorRow>(
        "/api/admin/doctors",
        {
          fullName: form.get("fullName"),
          specialty: form.get("specialty") || undefined,
          hospitalId: hospitalId || null,
        },
        token
      );
      if (!created) {
        toast.error("Could not add doctor", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Doctor added", created.fullName);
      e.currentTarget.reset();
      onCreated(created);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-surface space-y-3 p-4">
      <h3 className="font-semibold text-navy-900 dark:text-navy-100">Add doctor</h3>
      <input name="fullName" required placeholder="Full name *" className={inputClass} />
      <input name="specialty" placeholder="Specialty" className={inputClass} />
      <select name="hospitalId" className={inputClass}>
        <option value="">Hospital (optional)</option>
        {hospitals.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={loading} className={adminBtnPrimary}>
        {loading ? "Adding…" : "Add doctor"}
      </button>
    </form>
  );
}
