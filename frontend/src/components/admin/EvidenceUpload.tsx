"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/api";
import { getPublicApiUrl } from "@/lib/env";
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
  const [items, setItems] = useState(existing);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
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
      setItems((prev) => [...prev, evidence]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    await clientApi.delete(`/api/admin/evidence/${id}`, token);
    setItems((prev) => prev.filter((i) => i.id !== id));
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-navy-200 p-4">
      <h3 className="text-sm font-semibold text-navy-900">Evidence</h3>
      <p className="mt-1 text-xs text-navy-500">Images, videos, PDFs (max 10MB). Requires Cloudinary configuration.</p>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-navy-300 px-4 py-3 text-sm text-navy-600 hover:bg-navy-50">
        <Upload className="h-4 w-4" />
        {uploading ? "Uploading..." : "Upload evidence file"}
        <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {items.length > 0 && (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 rounded-xl bg-navy-50 px-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <span>{item.fileName ?? item.description ?? item.type}</span>
              <button type="button" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
