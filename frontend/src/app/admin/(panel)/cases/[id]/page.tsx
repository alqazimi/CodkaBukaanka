import { notFound } from "next/navigation";
import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { CaseForm } from "@/components/admin/CaseForm";
import { AdminHero, AdminPage, adminBtnSecondary } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import Link from "next/link";
import type { EvidenceItem } from "@/types/entities";

type FormOptions = {
  hospitals: { id: string; name: string }[];
  patients: { id: string; fullName: string }[];
  doctors: { id: string; fullName: string; hospitalId?: string | null }[];
  medications: { id: string; name: string }[];
};

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [caseRes, optionsRes] = await Promise.all([
    adminServerGet<Record<string, unknown> & { evidence?: EvidenceItem[] }>(`/api/admin/cases/${id}`),
    adminServerGet<FormOptions>("/api/admin/form-options"),
  ]);
  redirectIfSessionExpired({ code: caseRes.code ?? optionsRes.code, error: caseRes.error ?? optionsRes.error });
  const loadError = caseRes.error ?? optionsRes.error;
  const options = optionsRes.data;
  const caseRecord = caseRes.data;

  if (!caseRecord && !loadError) notFound();

  return (
    <AdminPage>
      <AdminHero>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">Edit Case</h1>
          {caseRecord ? (
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/cases/${id}/preview`} className={`${adminBtnSecondary} text-center text-xs uppercase tracking-wide`}>
                Preview
              </Link>
              {caseRecord.status === "PUBLISHED" && (
                <Link
                  href={`/so/cases/${caseRecord.slug}`}
                  target="_blank"
                  className={`${adminBtnSecondary} text-center text-xs uppercase tracking-wide`}
                >
                  View live
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </AdminHero>
      <div className="mt-6 sm:mt-8">
        {loadError ? <AdminApiErrorBanner message={loadError} /> : null}
        {caseRecord ? (
          <CaseForm
            hospitals={options?.hospitals ?? []}
            patients={options?.patients ?? []}
            doctors={options?.doctors ?? []}
            medications={options?.medications ?? []}
            initial={caseRecord}
            caseId={String(caseRecord.id)}
            evidence={caseRecord.evidence ?? []}
          />
        ) : null}
      </div>
    </AdminPage>
  );
}
