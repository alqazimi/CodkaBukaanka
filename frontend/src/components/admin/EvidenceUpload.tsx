"use client";

import { useState } from "react";
import { clientApi } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import type { EvidenceItem, EvidenceType } from "@/types/entities";
import { Upload, Trash2, ExternalLink } from "lucide-react";

export function EvidenceUpload({
  caseId,
  existing = [],
  onChange,
}: {
  caseId: string;
  existing?: EvidenceItem[];
  onChange?: (items: EvidenceItem[]) => void;
}) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [items, setItems] = useState(existing);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadVisibility, setUploadVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");

  function updateItems(next: EvidenceItem[]) {
    setItems(next);
    onChange?.(next);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await clientApi.upload(file, uploadVisibility);
      const evidence = await clientApi.post<EvidenceItem>("/api/admin/evidence", {
        caseId,
        type: uploaded.type as EvidenceType,
        url: uploaded.url,
        publicId: uploaded.publicId,
        description: file.name,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
        visibility: uploaded.visibility ?? uploadVisibility,
      });
      if (evidence) {
        updateItems([...items, evidence]);
        toast.success("Evidence uploaded", file.name);
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

  async function toggleVisibility(item: EvidenceItem) {
    const next = item.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    const updated = await clientApi.patch<EvidenceItem>(`/api/admin/evidence/${item.id}`, { visibility: next });
    if (updated) {
      updateItems(items.map((i) => (i.id === item.id ? updated : i)));
      toast.success(next === "PUBLIC" ? "File is now public" : "File is now private");
    } else {
      toast.error("Could not update visibility");
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
    const result = await clientApi.delete(`/api/admin/evidence/${item.id}`);
    if (result) {
      updateItems(items.filter((i) => i.id !== item.id));
      toast.success("Evidence removed");
    } else {
      toast.error("Could not remove evidence");
    }
    setDeletingId(null);
  }

  return (
    <div className="rounded-xl border border-navy-200 p-4 sm:p-5 dark:border-navy-700">
      <p className="text-xs text-navy-500 dark:text-navy-400">
        Images, videos, PDFs (max 10MB). Uses Cloudinary when configured; otherwise files are stored on your Railway API.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-navy-700 dark:text-navy-300">Upload as</label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="radio" name="uploadVisibility" checked={uploadVisibility === "PRIVATE"} onChange={() => setUploadVisibility("PRIVATE")} />
          Private
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="radio" name="uploadVisibility" checked={uploadVisibility === "PUBLIC"} onChange={() => setUploadVisibility("PUBLIC")} />
          Public
        </label>
      </div>

      <label className="mt-3 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border border-dashed border-navy-300 px-4 py-3 text-sm text-navy-600 transition hover:bg-navy-50 dark:border-navy-600 dark:text-navy-300 dark:hover:bg-navy-800">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading…" : "Upload evidence file"}
        <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} />
      </label>

      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded-xl bg-navy-50 px-3 py-3 text-sm dark:bg-navy-800/80 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-navy-800 dark:text-navy-200">{item.fileName ?? item.description ?? item.type}</p>
                <p className="mt-1 text-xs text-navy-500">
                  <span
                    className={
                      item.visibility === "PUBLIC"
                        ? "rounded bg-teal-100 px-1.5 py-0.5 text-teal-800"
                        : "rounded bg-navy-200 px-1.5 py-0.5 text-navy-700 dark:bg-navy-700 dark:text-navy-200"
                    }
                  >
                    {item.visibility === "PUBLIC" ? "Public on site" : "Private"}
                  </span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm dark:border-navy-600"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Preview
                </a>
                <button
                  type="button"
                  onClick={() => toggleVisibility(item)}
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-navy-200 px-3 py-1.5 text-sm dark:border-navy-600"
                >
                  Make {item.visibility === "PUBLIC" ? "private" : "public"}
                </button>
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item)}
                  className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {deletingId === item.id ? "Removing…" : "Remove"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
