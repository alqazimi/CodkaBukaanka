import Link from "next/link";
import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { CaseForm } from "@/components/admin/CaseForm";
import { AdminHero, AdminPage, AdminPageHeader, adminBtnSecondary } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

type FormOptions = {
  hospitals: { id: string; name: string; location?: string }[];
  patients: { id: string; fullName: string; age?: number | null }[];
  doctors: { id: string; fullName: string; hospitalId?: string | null }[];
  medications: { id: string; name: string }[];
};

type SubmissionPrefill = {
  submissionId: string;
  initial: Record<string, unknown>;
  extraHospitals?: FormOptions["hospitals"];
  extraPatients?: FormOptions["patients"];
  submitter: { name: string; email: string; phone?: string | null };
  evidenceCount: number;
};

function mergeOptions<T extends { id: string }>(
  base: T[],
  extra: T[] | undefined,
  sortKey: (item: T) => string
): T[] {
  const map = new Map(base.map((item) => [item.id, item]));
  for (const item of extra ?? []) {
    map.set(item.id, item);
  }
  return Array.from(map.values()).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ fromSubmission?: string }>;
}) {
  const { fromSubmission } = await searchParams;

  const [optionsRes, prefillRes] = await Promise.all([
    adminServerGet<FormOptions>("/api/admin/form-options"),
    fromSubmission
      ? adminServerGet<SubmissionPrefill>(`/api/admin/case-submissions/${fromSubmission}/prefill`)
      : Promise.resolve({ data: null as SubmissionPrefill | null, error: null, code: undefined }),
  ]);

  redirectIfSessionExpired({
    code: optionsRes.code ?? prefillRes.code,
    error: optionsRes.error ?? prefillRes.error,
  });

  const loadError = optionsRes.error ?? (fromSubmission ? prefillRes.error : null);
  const prefill = prefillRes.data;
  const options = optionsRes.data;

  const hospitals = mergeOptions(
    options?.hospitals ?? [],
    prefill?.extraHospitals,
    (item) => item.name
  );
  const patients = mergeOptions(
    options?.patients ?? [],
    prefill?.extraPatients,
    (item) => ("fullName" in item ? item.fullName : "")
  );

  return (
    <AdminPage>
      <AdminHero>
        <AdminPageHeader
          title={prefill ? "Create case from submission" : "Create Case"}
          description={
            prefill
              ? `Pre-filled from ${prefill.submitter.name} (${prefill.submitter.email}). Review, edit if needed, then save.`
              : "Fill in verified incident details and publish only after review."
          }
          className="!flex-col !gap-2"
        />
        {fromSubmission ? (
          <Link href="/admin/submissions" className={`${adminBtnSecondary} mt-3 inline-flex w-fit`}>
            Back to submissions
          </Link>
        ) : null}
      </AdminHero>
      <div className="mt-6 sm:mt-8">
        {loadError ? <AdminApiErrorBanner message={loadError} /> : null}
        {prefill && prefill.evidenceCount > 0 ? (
          <p className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted">
            {prefill.evidenceCount} submission file{prefill.evidenceCount === 1 ? "" : "s"} will be copied to the
            case as private evidence when you create the case.
          </p>
        ) : null}
        <CaseForm
          hospitals={hospitals}
          patients={patients}
          doctors={options?.doctors ?? []}
          medications={options?.medications ?? []}
          initial={prefill?.initial}
          submissionId={prefill?.submissionId}
        />
      </div>
    </AdminPage>
  );
}
