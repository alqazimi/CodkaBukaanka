import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { CaseForm } from "@/components/admin/CaseForm";
import { AdminHero, AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

type FormOptions = {
  hospitals: { id: string; name: string }[];
  patients: { id: string; fullName: string }[];
  doctors: { id: string; fullName: string; hospitalId?: string | null }[];
  medications: { id: string; name: string }[];
};

export default async function NewCasePage() {
  const { data: options, error: loadError, code } = await adminServerGet<FormOptions>("/api/admin/form-options");
  redirectIfSessionExpired({ code, error: loadError });

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
          hospitals={options?.hospitals ?? []}
          patients={options?.patients ?? []}
          doctors={options?.doctors ?? []}
          medications={options?.medications ?? []}
        />
      </div>
    </AdminPage>
  );
}
