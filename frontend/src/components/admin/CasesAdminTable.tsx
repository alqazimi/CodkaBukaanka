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
      <p className="admin-surface rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-muted">
        No cases in this view.
      </p>
    );
  }

  return (
    <>
      <ul className="space-y-3 md:hidden">
        {cases.map((c) => (
          <li key={c.id} className="admin-surface p-4 shadow-sm">
            <p className="font-mono text-xs text-muted">{c.caseNumber}</p>
            <Link href={`/admin/cases/${c.id}`} className="link-theme mt-1 block font-medium">
              {c.title}
            </Link>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
              <div>
                <dt className="text-subtle">Hospital</dt>
                <dd className="font-semibold text-white/90">{c.hospital?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-subtle">Patient</dt>
                <dd className="font-semibold text-white/90">{c.patient?.fullName ?? "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-subtle">Status</dt>
                <dd className="font-semibold text-white/90">{statusLabel(c.status)}</dd>
              </div>
            </dl>
            {(c.publicEvidenceCount ?? 0) === 0 && c.status !== "DRAFT" && (
              <p className="mt-2 text-xs text-red-300">No public evidence files</p>
            )}
            <div className="mt-4 flex justify-end border-t border-white/10 pt-3">
              <CaseDeleteButton caseId={c.id} caseTitle={c.title} />
            </div>
          </li>
        ))}
      </ul>

      <AdminTableWrap className="hidden md:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-wide text-subtle">
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
          <tbody className="divide-y divide-white/10">
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-xs text-muted">{c.caseNumber}</td>
                <td className="max-w-[240px] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/cases/${c.id}`} className="link-theme font-medium">
                      {c.title}
                    </Link>
                    {c.needsEvidenceReupload ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-red-400/40 bg-red-950/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-red-200"
                        title="Evidence was stored on temporary server disk and must be re-uploaded"
                      >
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        Re-upload
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-white/85">{c.hospital?.name ?? "—"}</td>
                <td className="px-4 py-3 text-white/85">{c.patient?.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-white/85">{statusLabel(c.status)}</td>
                <td className="px-4 py-3">
                  {c.riskLevel && (
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${RISK_LEVEL_COLORS[c.riskLevel as RiskLevel]}`}>
                      {c.riskLevel}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
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
