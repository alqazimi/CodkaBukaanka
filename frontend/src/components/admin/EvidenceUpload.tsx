"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";
import { getPublicApiUrl } from "@/lib/env";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import type { EvidenceItem, EvidenceType } from "@/types/entities";
import { Upload, Trash2 } from "lucide-react";

export function EvidenceUpload({
  caseId,
  token,
  existing = [],
}: {
  caseId: string;
  token: string;
  existing?: EvidenceItem[];
}) {
  const router = useRouter();
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [items, setItems] = useState(existing);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${getPublicApiUrl()}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }
      const uploaded = await res.json();
      const evidence = await clientApi.post<EvidenceItem>(
        "/api/admin/evidence",
        {
          caseId,
          type: uploaded.type as EvidenceType,
          url: uploaded.url,
          publicId: uploaded.publicId,
          description: file.name,
          fileName: uploaded.fileName,
          mimeType: uploaded.mimeType,
          fileSize: uploaded.fileSize,
        },
        token
      );
      if (evidence) {
        setItems((prev) => [...prev, evidence]);
        toast.success("Evidence uploaded", file.name);
        refreshAdminPage(router);
      } else {
        toast.error("Upload failed", "Could not attach file to this case.");
      }
    } catch (err) {
      toast.error("Upload failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(item: EvidenceItem) {
    const label = item.fileName ?? item.description ?? "this file";
    const ok = await confirm({
      title: "Remove evidence?",
      description: `"${label}" will be permanently deleted from this case.`,
      confirmLabel: "Remove file",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(item.id);
    const result = await clientApi.delete(`/api/admin/evidence/${item.id}`, token);
    if (result) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success("Evidence removed");
      refreshAdminPage(router);
    } else {
      toast.error("Could not remove evidence");
    }
    setDeletingId(null);
  }

  return (
    <div className="rounded-xl border border-navy-200 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-100">Evidence</h3>
      <p className="mt-1 text-xs text-navy-500 dark:text-navy-400">Images, videos, PDFs (max 10MB). Requires Cloudinary configuration.</p>
      <label className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-dashed border-navy-300 px-4 py-3 text-sm text-navy-600 transition hover:bg-navy-50 dark:border-navy-600 dark:text-navy-300 dark:hover:bg-navy-800">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload evidence file"}
        <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} />
      </label>
      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 rounded-xl bg-navy-50 px-3 py-3 text-sm dark:bg-navy-800/80 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium text-navy-800 dark:text-navy-200">{item.fileName ?? item.description ?? item.type}</span>
              <button
                type="button"
                disabled={deletingId === item.id}
                onClick={() => handleDelete(item)}
                className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {deletingId === item.id ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
