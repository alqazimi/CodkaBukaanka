"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi, getLastApiError } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary } from "@/components/admin/admin-ui";

export function HospitalForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [loading, setLoading] = useState(false);
  const toast = useAdminToast();
  const inputClass = "w-full min-h-[44px] rounded-xl border border-navy-200 px-3.5 py-2.5 text-base sm:text-sm";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      toast.error("Session expired", "Please sign in again.");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const description = String(form.get("description") ?? "").trim();
    try {
      const created = await clientApi.post(
        "/api/admin/hospitals",
        {
          name: String(form.get("name") ?? "").trim(),
          location: String(form.get("location") ?? "").trim(),
          ...(description ? { description } : {}),
        },
        token
      );
      if (!created) {
        toast.error("Could not add hospital", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Hospital added", String(form.get("name")));
      e.currentTarget.reset();
      refreshAdminPage(router);
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
