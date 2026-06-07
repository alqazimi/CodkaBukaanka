"use client";

import { useEffect, useMemo, useState } from "react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import {
  adminBtnDanger,
  adminBtnSecondary,
  adminInputClass,
  adminTabActive,
  adminTabInactive,
  adminTextMuted,
} from "@/components/admin/admin-ui";
import { EvidenceLightbox, type LightboxSlide } from "@/components/admin/EvidenceLightbox";
import type { EvidenceItem, EvidenceType } from "@/types/entities";
import { EVIDENCE_FRAME } from "@/lib/evidence-display-url";
import { evidenceImageDisplaySrc, evidenceStreamDisplaySrc, isDisplayableEvidenceUrl } from "@/lib/evidence-view-url";
import { isEphemeralLocalEvidence, countEphemeralLocalEvidence } from "@/lib/evidence-storage";
import { getEvidenceOpenHref } from "@/lib/evidence-open";
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
  AlertTriangle,
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
  const ephemeral = isEphemeralLocalEvidence(item);
  const canPreview =
    (item.type === "IMAGE" || item.type === "VIDEO") && isDisplayableEvidenceUrl(item.url);
  const sizeLabel = formatBytes(item.fileSize);

  return (
    <article className="card-surface overflow-hidden transition hover:border-red-400/30">
      <div className="grid gap-0 md:grid-cols-[minmax(0,200px)_1fr]">
        <div className="relative border-b border-white/10 bg-white/5 md:border-b-0 md:border-r">
          {item.type === "IMAGE" && canPreview ? (
            <div className={`relative w-full overflow-hidden ${EVIDENCE_FRAME.adminThumb}`}>
              <img
                src={evidenceImageDisplaySrc(item.url, "thumb")}
                alt=""
                className="absolute inset-0 h-full w-full object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : item.type === "VIDEO" && canPreview ? (
            <div className={`relative w-full overflow-hidden bg-black ${EVIDENCE_FRAME.adminThumb}`}>
              <video
                src={evidenceStreamDisplaySrc(item.url)}
                className="absolute inset-0 h-full w-full object-contain"
                muted
                preload="metadata"
              />
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center gap-2 p-6 text-muted ${EVIDENCE_FRAME.adminThumb}`}
            >
              <Icon className="h-10 w-10 opacity-50" />
              <span className="text-xs font-medium uppercase tracking-wide">{item.type}</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
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
                  ? "inline-flex items-center gap-1 rounded-full bg-red-950/40 px-2.5 py-1 text-xs font-medium text-red-200 ring-1 ring-red-400/50"
                  : "inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-white/10"
              }
            >
              {isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
              {isPublic ? "Public on site" : "Private"}
            </span>
            {ephemeral ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-950/40 px-2.5 py-1 text-xs font-medium text-red-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                Re-upload
              </span>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-subtle">
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
              className="link-theme mt-2 text-sm font-medium disabled:opacity-50"
            >
              {savingCaption ? "Saving…" : "Save caption"}
            </button>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {canPreview && item.type === "IMAGE" && (
              <button type="button" onClick={onOpenPreview} className={adminBtnSecondary}>
                <Eye className="h-4 w-4" />
                Preview
              </button>
            )}
            {canPreview && getEvidenceOpenHref(item.url) && (
              <a
                href={getEvidenceOpenHref(item.url)!}
                target="_blank"
                rel="noopener noreferrer"
                className={adminBtnSecondary}
              >
                {item.type === "VIDEO" ? "Open video" : "Open original"}
              </a>
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
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    clientApi
      .get<{ uploadsReady: boolean; message?: string | null }>("/api/admin/storage-status")
      .then((status) => {
        if (cancelled || !status?.message || status.uploadsReady) return;
        setStorageWarning(status.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        .filter((i) => (i.type === "IMAGE" || i.type === "VIDEO") && isDisplayableEvidenceUrl(i.url))
        .map((i) => ({
          url: i.url,
          title: i.fileName ?? i.type,
          caption: captionDrafts[i.id] ?? i.description ?? null,
          kind: i.type === "VIDEO" ? ("video" as const) : ("image" as const),
        })),
    [items, captionDrafts]
  );

  const staleLocalCount = useMemo(() => countEphemeralLocalEvidence(items), [items]);

  function openPreview(item: EvidenceItem) {
    const visual = items.filter(
      (i) => (i.type === "IMAGE" || i.type === "VIDEO") && isDisplayableEvidenceUrl(i.url)
    );
    const idx = visual.findIndex((v) => v.id === item.id);
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
      description: `"${label}" will be moved to the recycle bin. Only the owner can restore or permanently delete it.`,
      confirmLabel: "Remove file",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(item.id);
    const result = await clientApi.delete(`/api/admin/evidence/${item.id}`);
    if (result) {
      updateItems(items.filter((i) => i.id !== item.id));
      toast.success("Evidence moved to recycle bin");
    } else {
      toast.error("Could not remove evidence");
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-6">
      {storageWarning ? (
        <div className="rounded-2xl border border-red-300/80 bg-red-50/90 px-4 py-3 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-white/90">
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {storageWarning}
          </p>
        </div>
      ) : null}
      {staleLocalCount > 0 ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-white/90">
          <p className="flex items-start gap-2 font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {staleLocalCount} file{staleLocalCount === 1 ? "" : "s"} stored on temporary server disk and may not show on
            the public site. Remove and upload again — new files are saved to Cloudinary permanently.
          </p>
        </div>
      ) : null}
      <EvidenceLightbox
        slides={previewSlides}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Add evidence</h3>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Upload photos, videos, or documents. Add a caption beside each file — public files show on the live case
              page. Use Preview or Open original for the full image.
            </p>
          </div>
          <div className="flex shrink-0 gap-2 rounded-xl bg-white/5 p-1 ring-1 ring-white/10">
            <button
              type="button"
              onClick={() => setUploadVisibility("PUBLIC")}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                uploadVisibility === "PUBLIC"
                  ? adminTabActive
                  : adminTabInactive
              }`}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setUploadVisibility("PRIVATE")}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                uploadVisibility === "PRIVATE"
                  ? "border-white/10 bg-white/10 text-white"
                  : adminTabInactive
              }`}
            >
              Private
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-subtle">
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

        <label className="mt-4 flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-400/50 bg-red-950/40 px-4 py-3 text-sm font-medium text-white/90 transition hover:border-red-400 hover:bg-red-950/60">
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
        <p className="mt-2 text-center text-xs text-subtle">JPEG, PNG, WebP, MP4, PDF · Max 10MB</p>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-white/85">
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
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted">
          No evidence yet. Upload your first file above.
        </p>
      )}
    </div>
  );
}
