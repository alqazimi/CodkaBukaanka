import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { MedicationsSection } from "@/components/admin/MedicationsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

export default async function AdminMedicationsPage() {
  const { data: medications, error, code } = await adminServerGet<{ id: string; name: string; type?: string }[]>(
    "/api/admin/medications"
  );
  redirectIfSessionExpired({ code, error });

  return (
    <AdminPage>
      <AdminPageHeader title="Medications" description="Drugs and products referenced in incidents." />
      {error ? <AdminApiErrorBanner message={error} /> : null}
      <MedicationsSection initialMedications={medications ?? []} />
    </AdminPage>
  );
}
