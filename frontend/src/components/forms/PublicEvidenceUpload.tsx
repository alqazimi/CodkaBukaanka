"use client";

import { useMemo, useRef, useState } from "react";
import { FileImage, FileText, Film, Paperclip, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  ALLOWED_EVIDENCE_ACCEPT,
  formatEvidenceBytes,
  MAX_EVIDENCE_FILE_MB,
  MAX_SUBMISSION_EVIDENCE_FILES,
  validateEvidenceFile,
} from "@/lib/submission-evidence";

export type SelectedEvidenceFile = {
  id: string;
  file: File;
};

function fileIcon(file: File) {
  if (file.type.startsWith("image/")) return FileImage;
  if (file.type.startsWith("video/")) return Film;
  return FileText;
}

export function PublicEvidenceUpload({
  files,
  onChange,
  disabled = false,
  error,
}: {
  files: SelectedEvidenceFile[];
  onChange: (files: SelectedEvidenceFile[]) => void;
  disabled?: boolean;
  error?: string;
}) {
  const t = useTranslations("caseSubmission");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickerError, setPickerError] = useState("");
  const remaining = MAX_SUBMISSION_EVIDENCE_FILES - files.length;

  const totalSize = useMemo(
    () => files.reduce((sum, item) => sum + item.file.size, 0),
    [files]
  );

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;

    const next = [...files];
    const errors: string[] = [];

    for (const file of incoming) {
      if (next.length >= MAX_SUBMISSION_EVIDENCE_FILES) {
        errors.push(t("evidenceTooMany", { max: MAX_SUBMISSION_EVIDENCE_FILES }));
        break;
      }
      const validationError = validateEvidenceFile(file);
      if (validationError) {
        errors.push(validationError);
        continue;
      }
      if (next.some((item) => item.file.name === file.name && item.file.size === file.size)) {
        continue;
      }
      next.push({ id: `${file.name}-${file.size}-${file.lastModified}`, file });
    }

    onChange(next);
    setPickerError(errors[0] ?? "");
  }

  function removeFile(id: string) {
    onChange(files.filter((item) => item.id !== id));
    setPickerError("");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-relaxed text-white/70">{t("evidenceUploadHelp")}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_EVIDENCE_ACCEPT}
          disabled={disabled || remaining <= 0}
          className="sr-only"
          id="case-submission-evidence"
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <label
          htmlFor="case-submission-evidence"
          className={`inline-flex min-h-[44px] touch-manipulation cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:border-red-400/35 hover:bg-white/10 ${
            disabled || remaining <= 0 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Paperclip className="h-4 w-4 shrink-0 text-red-300" aria-hidden />
          {t("evidenceChooseFiles")}
        </label>
        <p className="text-xs font-medium text-white/55">
          {t("evidenceLimits", { max: MAX_SUBMISSION_EVIDENCE_FILES, size: MAX_EVIDENCE_FILE_MB })}
          {files.length > 0 ? ` · ${t("evidenceSelectedCount", { count: files.length })}` : ""}
          {files.length > 0 ? ` · ${formatEvidenceBytes(totalSize)}` : ""}
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
          {files.map(({ id, file }) => {
            const Icon = fileIcon(file);
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5"
              >
                <Icon className="h-5 w-5 shrink-0 text-red-300" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{file.name}</p>
                  <p className="text-xs text-white/55">{formatEvidenceBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeFile(id)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white/70 transition hover:border-red-400/35 hover:text-white"
                  aria-label={t("evidenceRemoveFile", { name: file.name })}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {(error || pickerError) && (
        <p className="text-sm font-medium text-red-300" role="alert">
          {error || pickerError}
        </p>
      )}
    </div>
  );
}
