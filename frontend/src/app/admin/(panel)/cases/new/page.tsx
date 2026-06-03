import { requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { CaseForm } from "@/components/admin/CaseForm";
import { AdminHero, AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

export default async function NewCasePage() {
  await requireAdmin();

  const [hospitalsRes, patientsRes, doctorsRes, medicationsRes] = await Promise.all([
    adminServerGet<{ id: string; name: string }[]>("/api/admin/hospitals"),
    adminServerGet<{ id: string; fullName: string }[]>("/api/admin/patients"),
    adminServerGet<{ id: string; fullName: string }[]>("/api/admin/doctors"),
    adminServerGet<{ id: string; name: string }[]>("/api/admin/medications"),
  ]);
  const loadError =
    hospitalsRes.error ?? patientsRes.error ?? doctorsRes.error ?? medicationsRes.error;

  return (
    <AdminPage>
      <AdminHero>
        <AdminPageHeader
          title="Create Case"
          description="Fill in verified incident details and publish only after review."
          className="!flex-col !gap-2"
        />
      </AdminHero>
      <div className="mt-6 sm:mt-8">
        {loadError ? <AdminApiErrorBanner message={loadError} /> : null}
        <CaseForm
          hospitals={hospitalsRes.data ?? []}
          patients={patientsRes.data ?? []}
          doctors={doctorsRes.data ?? []}
          medications={medicationsRes.data ?? []}
        />
      </div>
    </AdminPage>
  );
}
