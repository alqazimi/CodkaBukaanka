"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary } from "@/components/admin/admin-ui";

export function DoctorForm({ hospitals }: { hospitals: { id: string; name: string }[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [loading, setLoading] = useState(false);
  const toast = useAdminToast();
  const inputClass = "w-full rounded-lg border border-navy-200 px-3 py-2 text-sm";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      toast.error("Session expired", "Please sign in again.");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const created = await clientApi.post("/api/admin/doctors", {
      fullName: form.get("fullName"),
      specialty: form.get("specialty") || undefined,
      hospitalId: form.get("hospitalId") || null,
    }, token);
    if (!created) {
      toast.error("Could not add doctor", "Please try again.");
      setLoading(false);
      return;
    }
    toast.success("Doctor added", String(form.get("fullName")));
    refreshAdminPage(router);
    e.currentTarget.reset();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="admin-surface space-y-3 p-4">
      <h3 className="font-semibold text-navy-900 dark:text-navy-100">Add doctor</h3>
      <input name="fullName" required placeholder="Full name *" className={inputClass} />
      <input name="specialty" placeholder="Specialty" className={inputClass} />
      <select name="hospitalId" className={inputClass}>
        <option value="">Hospital (optional)</option>
        {hospitals.map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
      <button type="submit" disabled={loading} className={adminBtnPrimary}>
        {loading ? "Adding…" : "Add doctor"}
      </button>
    </form>
  );
}
