import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { CaseDeleteButton } from "@/components/admin/CaseDeleteButton";
import { AdminTableWrap } from "@/components/admin/admin-ui";
import { STATUS_LABELS, RISK_LEVEL_COLORS } from "@/lib/constants";
import type { CaseStatus, RiskLevel } from "@/types/entities";

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

function statusLabel(status: string) {
  return STATUS_LABELS[status as CaseStatus]?.en ?? status;
}

export function CasesAdminTable({ cases }: { cases: CaseRow[] }) {
  if (!cases.length) {
    return (
      <p className="rounded-xl border border-dashed border-navy-200 bg-white px-4 py-8 text-center text-sm text-navy-500 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-400">
        No cases in this view.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {cases.map((c) => (
          <li key={c.id} className="admin-surface p-4 shadow-sm">
            <p className="font-mono text-xs text-navy-500">{c.caseNumber}</p>
            <Link href={`/admin/cases/${c.id}`} className="mt-1 block font-medium text-teal-700 hover:underline">
              {c.title}
            </Link>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-navy-600">
              <div>
                <dt className="text-navy-400">Hospital</dt>
                <dd className="font-medium text-navy-800">{c.hospital?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-navy-400">Patient</dt>
                <dd className="font-medium text-navy-800">{c.patient?.fullName ?? "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-navy-400">Status</dt>
                <dd className="font-medium text-navy-800">{statusLabel(c.status)}</dd>
              </div>
            </dl>
            {(c.publicEvidenceCount ?? 0) === 0 && c.status !== "DRAFT" && (
              <p className="mt-2 text-xs text-amber-700">No public evidence files</p>
            )}
            <div className="mt-4 flex justify-end border-t border-navy-50 pt-3">
              <CaseDeleteButton caseId={c.id} caseTitle={c.title} />
            </div>
          </li>
        ))}
      </ul>

      <AdminTableWrap className="hidden md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-navy-50 text-left text-xs uppercase tracking-wide text-navy-500 dark:bg-navy-800/80 dark:text-navy-400">
            <tr>
              <th className="px-4 py-3">Case #</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Hospital</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-navy-50/80 dark:hover:bg-navy-800/50">
                <td className="px-4 py-3 font-mono text-xs text-navy-500 dark:text-navy-400">{c.caseNumber}</td>
                <td className="max-w-[240px] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/cases/${c.id}`} className="font-medium text-teal-700 hover:underline dark:text-teal-400">
                      {c.title}
                    </Link>
                    {c.needsEvidenceReupload ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                        title="Evidence was stored on temporary server disk and must be re-uploaded"
                      >
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        Re-upload
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-navy-600 dark:text-navy-300">{c.hospital?.name ?? "—"}</td>
                <td className="px-4 py-3 text-navy-600 dark:text-navy-300">{c.patient?.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-navy-600 dark:text-navy-300">{statusLabel(c.status)}</td>
                <td className="px-4 py-3">
                  {c.riskLevel && (
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${RISK_LEVEL_COLORS[c.riskLevel as RiskLevel]}`}>
                      {c.riskLevel}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-navy-500">
                  {c.publicEvidenceCount ?? 0} public / {c._count?.evidence ?? 0} total
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <CaseDeleteButton caseId={c.id} caseTitle={c.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableWrap>
    </>
  );
}
