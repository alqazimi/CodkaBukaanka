import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { CaseForm } from "@/components/admin/CaseForm";
import { AdminHero, AdminPage, adminBtnSecondary } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import Link from "next/link";
import type { EvidenceItem } from "@/types/entities";

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [caseRes, hospitalsRes, patientsRes, doctorsRes, medicationsRes] = await Promise.all([
    adminServerGet<Record<string, unknown> & { evidence?: EvidenceItem[] }>(`/api/admin/cases/${id}`),
    adminServerGet<{ id: string; name: string }[]>("/api/admin/hospitals"),
    adminServerGet<{ id: string; fullName: string }[]>("/api/admin/patients"),
    adminServerGet<{ id: string; fullName: string }[]>("/api/admin/doctors"),
    adminServerGet<{ id: string; name: string }[]>("/api/admin/medications"),
  ]);
  const loadError =
    caseRes.error ??
    hospitalsRes.error ??
    patientsRes.error ??
    doctorsRes.error ??
    medicationsRes.error;
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
            hospitals={hospitalsRes.data ?? []}
            patients={patientsRes.data ?? []}
            doctors={doctorsRes.data ?? []}
            medications={medicationsRes.data ?? []}
            initial={caseRecord}
            caseId={String(caseRecord.id)}
            evidence={caseRecord.evidence ?? []}
          />
        ) : null}
      </div>
    </AdminPage>
  );
}
