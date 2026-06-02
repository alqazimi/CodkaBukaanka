import { notFound } from "next/navigation";
import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { CaseForm } from "@/components/admin/CaseForm";
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
    <div className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-navy-200/70 bg-gradient-to-br from-white to-navy-50/40 p-6 shadow-soft">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-navy-900">Edit Case</h1>
        {caseRecord.status !== "DRAFT" && caseRecord.status !== "UNDER_REVIEW" && (
          <Link href={`/en/cases/${caseRecord.slug}`} target="_blank" className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-teal-700 transition hover:bg-teal-100">View public page</Link>
        )}
      </div>
      <div className="mt-8">
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
    </div>
  );
}
