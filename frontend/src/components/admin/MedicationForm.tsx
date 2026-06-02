"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary } from "@/components/admin/admin-ui";

export function MedicationForm() {
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
    const created = await clientApi.post("/api/admin/medications", {
      name: form.get("name"),
      type: form.get("type") || undefined,
    }, token);
    if (!created) {
      toast.error("Could not add medication", "Please try again.");
      setLoading(false);
      return;
    }
    toast.success("Medication added", String(form.get("name")));
    refreshAdminPage(router);
    e.currentTarget.reset();
    setLoading(false);
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
