"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi, getLastApiError } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger } from "@/components/admin/admin-ui";

export function CaseDeleteButton({ caseId, caseTitle }: { caseId: string; caseTitle?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!token) return;
    const label = caseTitle ? `"${caseTitle}"` : "This case";
    const ok = await confirm({
      title: "Delete case?",
      description: `${label} and its evidence will be permanently removed. This action cannot be undone.`,
      confirmLabel: "Delete case",
      variant: "danger",
    });
    if (!ok) return;

    setLoading(true);
    try {
      const result = await clientApi.delete(`/api/admin/cases/${caseId}`, token);
      if (!result) {
        toast.error("Could not delete case", getLastApiError() ?? "Please try again.");
        return;
      }
      toast.success("Case deleted");
      refreshAdminPage(router);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" onClick={onDelete} disabled={loading} className={adminBtnDanger}>
      {loading ? "Deleting…" : "Delete case"}
    </button>
  );
}
