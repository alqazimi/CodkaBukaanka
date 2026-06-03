import { notFound } from "next/navigation";
import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { AdminPage, AdminHero, adminBtnSecondary } from "@/components/admin/admin-ui";
import Link from "next/link";
import { STATUS_LABELS, CATEGORY_LABELS, RISK_LEVEL_LABELS } from "@/lib/constants";
import type { CaseCategory, CaseStatus, RiskLevel } from "@/types/entities";

export default async function CasePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const token = await getAccessToken();

  const caseRecord = await serverApi.get<Record<string, unknown> & {
    title: string;
    caseNumber: string;
    status: CaseStatus;
    category: CaseCategory;
    riskLevel: RiskLevel;
    reasonForVisit: string;
    incidentDescription: string;
    currentCondition?: string | null;
    incidentDate: string;
    hospital?: { name: string; location: string };
    patient?: { fullName: string };
    evidence?: { url: string; fileName?: string | null; visibility: string }[];
  }>(`/api/admin/cases/${id}`, { cache: "no-store", token: token ?? undefined });

  if (!caseRecord) notFound();

  const publicEvidence = (caseRecord.evidence ?? []).filter((e) => e.visibility === "PUBLIC");

  return (
    <AdminPage>
      <AdminHero>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Admin preview</p>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-navy-900 dark:text-navy-50">{caseRecord.title}</h1>
            <p className="mt-1 font-mono text-xs text-navy-500">{caseRecord.caseNumber}</p>
          </div>
          <Link href={`/admin/cases/${id}`} className={`${adminBtnSecondary} text-center`}>
            Back to edit
          </Link>
        </div>
      </AdminHero>

      <div className="mt-6 max-w-3xl space-y-6">
        {caseRecord.status !== "PUBLISHED" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            This case is <strong>{STATUS_LABELS[caseRecord.status]?.en ?? caseRecord.status}</strong> — not visible on the public site yet.
          </p>
        )}

        <section className="card-surface space-y-3 p-6">
          <p className="text-sm text-navy-600">
            {CATEGORY_LABELS[caseRecord.category]?.en} · {RISK_LEVEL_LABELS[caseRecord.riskLevel]?.en}
          </p>
          <div>
            <h2 className="font-semibold text-navy-900 dark:text-navy-100">Reason for visit</h2>
            <p className="mt-1 text-sm text-navy-700 dark:text-navy-300">{caseRecord.reasonForVisit}</p>
          </div>
          <div>
            <h2 className="font-semibold text-navy-900 dark:text-navy-100">Incident</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-navy-700 dark:text-navy-300">{caseRecord.incidentDescription}</p>
          </div>
          {caseRecord.currentCondition && (
            <div>
              <h2 className="font-semibold text-navy-900 dark:text-navy-100">Current condition</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy-700 dark:text-navy-300">{caseRecord.currentCondition}</p>
            </div>
          )}
          <p className="text-xs text-navy-500">
            {caseRecord.hospital?.name} · {caseRecord.patient?.fullName} ·{" "}
            {new Date(caseRecord.incidentDate).toLocaleDateString()}
          </p>
        </section>

        <section className="card-surface p-6">
          <h2 className="font-semibold text-navy-900 dark:text-navy-100">Public evidence ({publicEvidence.length})</h2>
          {publicEvidence.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">No public evidence files attached.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {publicEvidence.map((e) => (
                <li key={e.url}>
                  <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-700 underline">
                    {e.fileName ?? e.url}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminPage>
  );
}
