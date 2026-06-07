"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { clientApi, getLastApiError, type PaginatedResponse } from "@/lib/api";
import { CasesAdminTable } from "@/components/admin/CasesAdminTable";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import { adminInputClass } from "@/components/admin/admin-ui";
import type { CaseStatus } from "@/types/entities";

type CaseRow = {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  slug: string;
  riskLevel?: string;
  hospital?: { name: string; location?: string };
  patient?: { fullName: string };
  publicEvidenceCount?: number;
  needsEvidenceReupload?: boolean;
  _count?: { evidence: number };
};

const STATUS_TABS: { value: "" | CaseStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "UNDER_REVIEW", label: "Review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "PUBLISHED", label: "Published" },
];

type CasesAdminPanelProps = {
  initialData?: PaginatedResponse<CaseRow> | null;
  initialError?: string | null;
  serverPrefetched?: boolean;
};

export function CasesAdminPanel({
  initialData = null,
  initialError = null,
  serverPrefetched = false,
}: CasesAdminPanelProps) {
  const urlParams = useSearchParams();
  const [status, setStatus] = useState<"" | CaseStatus>("");
  const [staleOnly, setStaleOnly] = useState(() => {
    const v = urlParams.get("staleEvidence");
    return v === "true" || v === "1";
  });
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<CaseRow> | null>(initialData);
  const [loading, setLoading] = useState(!serverPrefetched);
  const [loadError, setLoadError] = useState<string | null>(initialError);
  const [skipFirstFetch, setSkipFirstFetch] = useState(
    serverPrefetched && page === 1 && !status && !query && !staleOnly
  );

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "25");
    if (status) params.set("status", status);
    if (staleOnly) params.set("staleEvidence", "true");
    if (query.trim()) params.set("q", query.trim());

    const res = await clientApi.get<PaginatedResponse<CaseRow>>(`/api/admin/cases?${params.toString()}`);
    if (res) {
      setLoadError(null);
      setData({
        ...res,
        totalPages: Math.max(1, Math.ceil(res.total / res.limit)),
      });
    } else {
      setData(null);
      setLoadError(getLastApiError() ?? "Could not load cases.");
    }
    setLoading(false);
  }, [page, query, staleOnly, status]);

  useEffect(() => {
    if (skipFirstFetch) {
      setSkipFirstFetch(false);
      return;
    }
    load();
  }, [load, skipFirstFetch]);

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(searchInput);
  }

  return (
    <div className="space-y-4">
      {loadError ? <AdminApiErrorBanner message={loadError} /> : null}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setStatus(tab.value);
              setPage(1);
            }}
            className={`min-h-[40px] rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
              status === tab.value
                ? "border-teal-600 bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
                : "border-navy-200 text-navy-600 hover:bg-navy-50 dark:border-navy-600 dark:text-navy-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setStaleOnly((v) => !v);
            setPage(1);
          }}
          className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
            staleOnly
              ? "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
              : "border-navy-200 text-navy-600 hover:bg-navy-50 dark:border-navy-600 dark:text-navy-300"
          }`}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden />
          Re-upload needed
        </button>
      </div>

      <form onSubmit={applySearch} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search case #, title, hospital, patient…"
          className={adminInputClass}
        />
        <button
          type="submit"
          className="min-h-[44px] shrink-0 rounded-xl border border-navy-200 px-4 text-sm font-medium text-navy-700 dark:border-navy-600 dark:text-navy-200"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <CasesAdminTable cases={data?.items ?? []} />
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm text-navy-600 dark:text-navy-400">
          <span>
            Page {data.page} of {data.totalPages} · {data.total} cases
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-navy-200 px-3 py-1.5 disabled:opacity-40 dark:border-navy-600"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-navy-200 px-3 py-1.5 disabled:opacity-40 dark:border-navy-600"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {!loading && data?.total === 0 && (
        <p className="text-center text-sm text-navy-500">
          No cases match your filters.{" "}
          <Link href="/admin/cases/new" className="text-teal-700 underline">
            Create a case
          </Link>
        </p>
      )}
    </div>
  );
}
