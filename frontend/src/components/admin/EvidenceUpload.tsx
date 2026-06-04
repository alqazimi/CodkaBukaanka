"use client";

import { useEffect, useMemo, useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import {
  adminBtnDanger,
  adminBtnSecondary,
  adminInputClass,
  adminTextMuted,
} from "@/components/admin/admin-ui";
import { EvidenceLightbox, type LightboxSlide } from "@/components/admin/EvidenceLightbox";
import type { EvidenceItem, EvidenceType } from "@/types/entities";
import { isSafeExternalUrl } from "@/lib/safe-url";
import {
  Upload,
  Trash2,
  Eye,
  Globe,
  Lock,
  FileText,
  FileImage,
  Film,
  Loader2,
} from "lucide-react";

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes < 1) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeIcon(type: EvidenceType) {
  if (type === "IMAGE") return FileImage;
  if (type === "VIDEO") return Film;
  return FileText;
}

function EvidenceAdminCard({
  item,
  captionDraft,
  onCaptionChange,
  onSaveCaption,
  savingCaption,
  onToggleVisibility,
  onDelete,
  deleting,
  onOpenPreview,
}: {
  item: EvidenceItem;
  captionDraft: string;
  onCaptionChange: (value: string) => void;
  onSaveCaption: () => void;
  savingCaption: boolean;
  onToggleVisibility: () => void;
  onDelete: () => void;
  deleting: boolean;
  onOpenPreview: () => void;
}) {
  const Icon = typeIcon(item.type);
  const isPublic = item.visibility === "PUBLIC";
  const canPreview =
    (item.type === "IMAGE" || item.type === "VIDEO") && isSafeExternalUrl(item.url);
  const sizeLabel = formatBytes(item.fileSize);

  return (
    <article className="overflow-hidden rounded-2xl border border-navy-200/80 bg-white shadow-sm transition hover:shadow-md dark:border-navy-700/80 dark:bg-navy-900/90">
      <div className="grid gap-0 md:grid-cols-[minmax(0,220px)_1fr]">
        <div className="relative border-b border-navy-100 bg-navy-50/80 dark:border-navy-800 dark:bg-navy-950/80 md:border-b-0 md:border-r">
          {item.type === "IMAGE" && canPreview ? (
            <button
              type="button"
              onClick={onOpenPreview}
              className="group relative block aspect-[4/3] w-full overflow-hidden md:aspect-square md:min-h-[200px]"
              aria-label={`View ${item.fileName ?? "image"}`}
            >
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 transition group-hover:bg-navy-950/40">
                <span className="flex translate-y-1 items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-navy-900 opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
                  <Eye className="h-4 w-4" />
                  View full size
                </span>
              </span>
            </button>
          ) : item.type === "VIDEO" && canPreview ? (
            <button
              type="button"
              onClick={onOpenPreview}
              className="group relative block aspect-video w-full bg-black md:min-h-[200px]"
              aria-label="Play video"
            >
              <video src={item.url} className="h-full w-full object-cover" muted preload="metadata" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-navy-900">
                  Play video
                </span>
              </span>
            </button>
          ) : (
            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 p-6 text-navy-500 md:aspect-square md:min-h-[200px]">
              <Icon className="h-10 w-10 opacity-50" />
              <span className="text-xs font-medium uppercase tracking-wide">{item.type}</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy-900 dark:text-navy-50">
                {item.fileName ?? "Uploaded file"}
              </p>
              <p className={adminTextMuted}>
                {item.type}
                {sizeLabel ? ` · ${sizeLabel}` : ""}
              </p>
            </div>
            <span
              className={
                isPublic
                  ? "inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 ring-1 ring-teal-200/80 dark:bg-teal-950/50 dark:text-teal-200 dark:ring-teal-800/60"
                  : "inline-flex items-center gap-1 rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-700 ring-1 ring-navy-200/80 dark:bg-navy-800 dark:text-navy-200 dark:ring-navy-700"
              }
            >
              {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {isPublic ? "Public on site" : "Private"}
            </span>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-navy-500">
              Caption / description
            </label>
            <textarea
              value={captionDraft}
              onChange={(e) => onCaptionChange(e.target.value)}
              rows={3}
              placeholder="Describe what this file shows (visible on the public case page when public)."
              className={`${adminInputClass} min-h-[88px] resize-y text-sm`}
            />
            <button
              type="button"
              disabled={savingCaption}
              onClick={onSaveCaption}
              className="mt-2 text-sm font-medium text-teal-700 hover:text-teal-600 disabled:opacity-50 dark:text-teal-400"
            >
              {savingCaption ? "Saving…" : "Save caption"}
            </button>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 border-t border-navy-100 pt-4 dark:border-navy-800">
            {canPreview && (
              <button type="button" onClick={onOpenPreview} className={adminBtnSecondary}>
                <Eye className="h-4 w-4" />
                Preview
              </button>
            )}
            <button type="button" onClick={onToggleVisibility} className={adminBtnSecondary}>
              {isPublic ? "Make private" : "Make public"}
            </button>
            <button type="button" disabled={deleting} onClick={onDelete} className={adminBtnDanger}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

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
  const [savingCaptionId, setSavingCaptionId] = useState<string | null>(null);
  const [uploadVisibility, setUploadVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [uploadCaption, setUploadCaption] = useState("");
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(existing);
    setCaptionDrafts((prev) => {
      const next = { ...prev };
      for (const item of existing) {
        if (next[item.id] === undefined) {
          next[item.id] = item.description ?? item.fileName ?? "";
        }
      }
      return next;
    });
  }, [existing]);

  function updateItems(next: EvidenceItem[]) {
    setItems(next);
    onChange?.(next);
  }

  const previewSlides: LightboxSlide[] = useMemo(
    () =>
      items
        .filter((i) => (i.type === "IMAGE" || i.type === "VIDEO") && isSafeExternalUrl(i.url))
        .map((i) => ({
          url: i.url,
          title: i.fileName ?? i.type,
          caption: captionDrafts[i.id] ?? i.description ?? null,
          kind: i.type === "VIDEO" ? ("video" as const) : ("image" as const),
        })),
    [items, captionDrafts]
  );

  function openPreview(item: EvidenceItem) {
    const idx = previewSlides.findIndex((s) => s.url === item.url);
    setLightboxIndex(idx >= 0 ? idx : 0);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await clientApi.upload(file, uploadVisibility);
      const description = uploadCaption.trim() || file.name;
      const evidence = await clientApi.post<EvidenceItem>("/api/admin/evidence", {
        caseId,
        type: uploaded.type as EvidenceType,
        url: uploaded.url,
        publicId: uploaded.publicId,
        description,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        fileSize: uploaded.fileSize,
        visibility: uploaded.visibility ?? uploadVisibility,
      });
      if (evidence) {
        updateItems([...items, evidence]);
        setCaptionDrafts((prev) => ({ ...prev, [evidence.id]: description }));
        setUploadCaption("");
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

  async function saveCaption(item: EvidenceItem) {
    const description = (captionDrafts[item.id] ?? "").trim();
    setSavingCaptionId(item.id);
    const updated = await clientApi.patch<EvidenceItem>(`/api/admin/evidence/${item.id}`, { description });
    setSavingCaptionId(null);
    if (updated) {
      updateItems(items.map((i) => (i.id === item.id ? { ...i, ...updated } : i)));
      toast.success("Caption saved");
    } else {
      toast.error("Could not save caption", getLastApiError() ?? "Try again.");
    }
  }

  async function toggleVisibility(item: EvidenceItem) {
    const next = item.visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    const updated = await clientApi.patch<EvidenceItem>(`/api/admin/evidence/${item.id}`, { visibility: next });
    if (updated) {
      updateItems(items.map((i) => (i.id === item.id ? updated : i)));
      toast.success(next === "PUBLIC" ? "Visible on public site" : "Hidden from public site");
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
    <div className="space-y-6">
      <EvidenceLightbox
        slides={previewSlides}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

      <div className="rounded-2xl border border-dashed border-navy-200/90 bg-gradient-to-br from-navy-50/80 to-white p-5 dark:border-navy-700 dark:from-navy-900/50 dark:to-navy-950/30 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-navy-900 dark:text-navy-50">Add evidence</h3>
            <p className="mt-1 max-w-xl text-sm text-navy-600 dark:text-navy-400">
              Upload photos, videos, or documents. Click any image to view full size. Add a caption beside each file —
              public files show this text on the live case page.
            </p>
          </div>
          <div className="flex shrink-0 gap-2 rounded-xl bg-white p-1 shadow-sm ring-1 ring-navy-100 dark:bg-navy-900 dark:ring-navy-800">
            <button
              type="button"
              onClick={() => setUploadVisibility("PUBLIC")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                uploadVisibility === "PUBLIC"
                  ? "bg-teal-600 text-white"
                  : "text-navy-600 hover:bg-navy-50 dark:text-navy-300"
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setUploadVisibility("PRIVATE")}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                uploadVisibility === "PRIVATE"
                  ? "bg-navy-800 text-white dark:bg-navy-600"
                  : "text-navy-600 hover:bg-navy-50 dark:text-navy-300"
              }`}
            >
              Private
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-navy-500">
            Caption for next upload (optional)
          </label>
          <input
            type="text"
            value={uploadCaption}
            onChange={(e) => setUploadCaption(e.target.value)}
            placeholder="e.g. X-ray showing fracture, dated March 2025"
            className={adminInputClass}
          />
        </div>

        <label className="mt-4 flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm font-medium text-teal-900 transition hover:bg-teal-100 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-100 dark:hover:bg-teal-950/60">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading…" : "Choose file to upload"}
          <input
            type="file"
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        <p className="mt-2 text-center text-xs text-navy-500">JPEG, PNG, WebP, MP4, PDF · Max 10MB</p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm font-medium text-navy-700 dark:text-navy-300">
            {items.length} file{items.length === 1 ? "" : "s"} attached
          </p>
          {items.map((item) => (
            <EvidenceAdminCard
              key={item.id}
              item={item}
              captionDraft={captionDrafts[item.id] ?? item.description ?? item.fileName ?? ""}
              onCaptionChange={(value) => setCaptionDrafts((prev) => ({ ...prev, [item.id]: value }))}
              onSaveCaption={() => saveCaption(item)}
              savingCaption={savingCaptionId === item.id}
              onToggleVisibility={() => toggleVisibility(item)}
              onDelete={() => handleDelete(item)}
              deleting={deletingId === item.id}
              onOpenPreview={() => openPreview(item)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-navy-200 px-4 py-8 text-center text-sm text-navy-500 dark:border-navy-700">
          No evidence yet. Upload your first file above.
        </p>
      )}
    </div>
  );
}
