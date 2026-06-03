import { notFound } from "next/navigation";
import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { CaseForm } from "@/components/admin/CaseForm";
import { AdminHero, AdminPage, adminBtnSecondary } from "@/components/admin/admin-ui";
import Link from "next/link";
import type { EvidenceItem } from "@/types/entities";

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const token = await getAccessToken();

  const [caseRecord, hospitals, patients, doctors, medications] = await Promise.all([
    serverApi.get<Record<string, unknown> & { evidence?: EvidenceItem[] }>(`/api/admin/cases/${id}`, { cache: "no-store", token: token ?? undefined }),
    serverApi.get<{ id: string; name: string }[]>("/api/admin/hospitals", { cache: "no-store", token: token ?? undefined }),
    serverApi.get<{ id: string; fullName: string }[]>("/api/admin/patients", { cache: "no-store", token: token ?? undefined }),
    serverApi.get<{ id: string; fullName: string }[]>("/api/admin/doctors", { cache: "no-store", token: token ?? undefined }),
    serverApi.get<{ id: string; name: string }[]>("/api/admin/medications", { cache: "no-store", token: token ?? undefined }),
  ]);

  if (!caseRecord) notFound();

  return (
    <AdminPage>
      <AdminHero>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">Edit Case</h1>
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
        </div>
      </AdminHero>
      <div className="mt-6 sm:mt-8">
        <CaseForm
          hospitals={hospitals ?? []}
          patients={patients ?? []}
          doctors={doctors ?? []}
          medications={medications ?? []}
          initial={caseRecord}
          caseId={String(caseRecord.id)}
          evidence={caseRecord.evidence ?? []}
        />
      </div>
    </AdminPage>
  );
}
