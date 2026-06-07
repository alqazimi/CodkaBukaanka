"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import {
  adminBtnDanger,
  adminBtnSecondary,
  adminFilterActive,
  adminInputClass,
  adminTabInactive,
} from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import { CATEGORY_LABELS, WHAT_WENT_WRONG_LABELS } from "@/lib/constants";

export type SubmissionEvidenceItem = {
  id: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  url: string;
  createdAt: string;
};

export type SubmissionItem = {
  id: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string | null;
  title: string;
  reasonForVisit: string;
  incidentDescription: string;
  currentCondition?: string | null;
  whatWentWrong: keyof typeof WHAT_WENT_WRONG_LABELS;
  category: keyof typeof CATEGORY_LABELS;
  incidentDate: string;
  hospitalName: string;
  hospitalLocation?: string | null;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  doctorName?: string | null;
  medicationName?: string | null;
  evidenceNotes: string;
  evidence?: SubmissionEvidenceItem[];
  createdAt: string;
  status?: "NEW" | "READ" | "ARCHIVED";
  internalNote?: string | null;
  linkedCaseId?: string | null;
  linkedCase?: { id: string; caseNumber: string; title: string; slug: string } | null;
  readBy?: { name: string } | null;
  suspicious?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

function formatField(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <p className="text-sm text-white/85">
      <span className="font-semibold text-white/70">{label}: </span>
      {value}
    </p>
  );
}

export function SubmissionsManager({ initialSubmissions = [] }: { initialSubmissions?: SubmissionItem[] }) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialSubmissions);
  const [status, setStatus] = useState<"all" | "new" | "read" | "archived">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(initialSubmissions.length === 0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubmissions.length > 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    clientApi
      .get<SubmissionItem[]>("/api/admin/case-submissions")
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) {
          setSubmissions(data);
          setLoadError(null);
        } else if (initialSubmissions.length === 0) {
          setLoadError(getLastApiError() ?? "Could not load submissions.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialSubmissions]);

  const filtered = useMemo(() => {
    return submissions.filter((item) => {
      if (status === "all") return true;
      if (status === "new") return (item.status ?? "NEW") === "NEW";
      if (status === "read") return item.status === "READ";
      return item.status === "ARCHIVED";
    });
  }, [submissions, status]);

  async function patchSubmission(id: string, body: Record<string, unknown>) {
    const updated = await clientApi.patch<SubmissionItem>(`/api/admin/case-submissions/${id}`, body);
    if (updated) {
      setSubmissions((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      return true;
    }
    toast.error("Could not update submission", getLastApiError() ?? "Please try again.");
    return false;
  }

  async function removeSubmission(item: SubmissionItem) {
    const ok = await confirm({
      title: "Delete submission?",
      description: `"${item.title}" will be moved to the recycle bin. Only the owner can restore or permanently delete it.`,
      confirmLabel: "Delete submission",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(item.id);
    const res = await clientApi.delete<{ ok: boolean }>(`/api/admin/case-submissions/${item.id}`);
    if (res?.ok) {
      setSubmissions((prev) => prev.filter((entry) => entry.id !== item.id));
      toast.success("Submission moved to recycle bin");
    } else {
      toast.error("Could not delete submission", getLastApiError() ?? "Please try again.");
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      {loadError ? <AdminApiErrorBanner message={loadError} /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {loading
            ? "Refreshing submissions…"
            : `${submissions.length} submission${submissions.length === 1 ? "" : "s"} loaded`}
        </p>
        <button
          type="button"
          className={adminBtnSecondary}
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setLoadError(null);
            clientApi.get<SubmissionItem[]>("/api/admin/case-submissions").then((data) => {
              if (Array.isArray(data)) {
                setSubmissions(data);
                setLoadError(null);
              } else {
                setLoadError(getLastApiError() ?? "Could not refresh submissions.");
              }
              setLoading(false);
            });
          }}
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "new", "read", "archived"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`min-h-[40px] rounded-xl border px-3.5 py-2 text-sm font-medium ${
              status === s ? adminFilterActive : adminTabInactive
            }`}
            onClick={() => setStatus(s)}
          >
            {s === "all" ? "All status" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((item) => (
          <li key={item.id} className="admin-surface p-4">
            <div className="flex flex-col gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-white">{item.title}</p>
                  {(item.status ?? "NEW") === "NEW" && (
                    <span className="rounded bg-red-950/40 px-2 py-0.5 text-xs font-medium text-red-200">New</span>
                  )}
                  {item.status === "ARCHIVED" && (
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-muted">Archived</span>
                  )}
                  {item.suspicious && (
                    <span className="rounded-md border border-red-400/40 bg-red-950/40 px-2 py-0.5 text-xs font-medium text-red-200">
                      Suspicious
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted">
                  {item.submitterName} ({item.submitterEmail})
                  {item.submitterPhone ? ` · ${item.submitterPhone}` : ""}
                </p>
                <p className="mt-2 text-xs text-subtle">
                  {dateFormatter.format(new Date(item.createdAt))} UTC
                  {item.readBy?.name ? ` · Read by ${item.readBy.name}` : ""}
                </p>

                <div className="mt-4 space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
                  {formatField("Reason for visit", item.reasonForVisit)}
                  {formatField("Incident", item.incidentDescription)}
                  {formatField("Current condition", item.currentCondition)}
                  {formatField(
                    "Classification",
                    `${WHAT_WENT_WRONG_LABELS[item.whatWentWrong]?.en ?? item.whatWentWrong} · ${CATEGORY_LABELS[item.category]?.en ?? item.category}`
                  )}
                  {formatField(
                    "Incident date",
                    new Date(item.incidentDate).toISOString().slice(0, 10)
                  )}
                  {formatField(
                    "Hospital",
                    item.hospitalLocation ? `${item.hospitalName} (${item.hospitalLocation})` : item.hospitalName
                  )}
                  {formatField(
                    "Patient",
                    item.patientAge
                      ? `${item.patientName}, age ${item.patientAge}${item.patientGender ? `, ${item.patientGender}` : ""}`
                      : item.patientName
                  )}
                  {formatField("Doctor", item.doctorName)}
                  {formatField("Medication", item.medicationName)}
                  {item.evidenceNotes
                    ? formatField("Evidence notes", item.evidenceNotes)
                    : null}
                  {(item.evidence?.length ?? 0) > 0 && (
                    <div className="pt-1">
                      <p className="text-sm font-semibold text-white/70">
                        Uploaded evidence ({item.evidence!.length})
                      </p>
                      <ul className="mt-2 space-y-2">
                        {item.evidence!.map((file) => (
                          <li key={file.id}>
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-red-200 transition hover:border-red-400/35 hover:bg-white/10"
                            >
                              <span className="truncate">{file.fileName ?? file.type}</span>
                              {file.fileSize ? (
                                <span className="shrink-0 text-xs text-white/50">
                                  {(file.fileSize / 1024).toFixed(0)} KB
                                </span>
                              ) : null}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {item.internalNote && (
                  <p className="mt-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-muted">
                    Note: {item.internalNote}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link href={`/admin/cases/new?fromSubmission=${item.id}`} className={adminBtnSecondary}>
                  Create case
                </Link>
                <a
                  href={`mailto:${encodeURIComponent(item.submitterEmail)}?subject=${encodeURIComponent(`Re: ${item.title}`)}`}
                  className={adminBtnSecondary}
                >
                  Reply by email
                </a>
                {item.linkedCaseId && (
                  <Link href={`/admin/cases/${item.linkedCaseId}`} className={adminBtnSecondary}>
                    Open linked case
                  </Link>
                )}
                {(item.status ?? "NEW") === "NEW" && (
                  <button
                    type="button"
                    className={adminBtnSecondary}
                    onClick={() => patchSubmission(item.id, { status: "READ" })}
                  >
                    Mark read
                  </button>
                )}
                {item.status !== "ARCHIVED" && (
                  <button
                    type="button"
                    className={adminBtnSecondary}
                    onClick={() => patchSubmission(item.id, { status: "ARCHIVED" })}
                  >
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  className={adminBtnDanger}
                  onClick={() => removeSubmission(item)}
                >
                  {deletingId === item.id ? "Deleting…" : "Delete"}
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={noteDrafts[item.id] ?? item.internalNote ?? ""}
                  onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Internal note (not visible to submitter)"
                  className={adminInputClass}
                />
                <button
                  type="button"
                  className={adminBtnSecondary}
                  onClick={() =>
                    patchSubmission(item.id, { internalNote: noteDrafts[item.id] ?? item.internalNote ?? "" })
                  }
                >
                  Save note
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {loading && <p className="text-center text-sm text-muted">Loading submissions…</p>}

      {!loading && submissions.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted">
          No case submissions yet. Public submissions from the{" "}
          <Link href="/submit-case" className="link-theme underline" target="_blank" rel="noopener noreferrer">
            Submit a Case page
          </Link>{" "}
          will appear here.
        </p>
      )}

      {!loading && submissions.length > 0 && filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted">
          No submissions in this view. Try another filter.
        </p>
      )}
    </div>
  );
}
