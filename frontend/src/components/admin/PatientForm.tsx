"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary } from "@/components/admin/admin-ui";

export function PatientForm() {
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
    const created = await clientApi.post("/api/admin/patients", {
      fullName: form.get("fullName"),
      age: form.get("age") || undefined,
      gender: form.get("gender") || undefined,
    }, token);
    if (!created) {
      toast.error("Could not add patient", "Please try again.");
      setLoading(false);
      return;
    }
    toast.success("Patient added", String(form.get("fullName")));
    refreshAdminPage(router);
    e.currentTarget.reset();
    setLoading(false);
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
