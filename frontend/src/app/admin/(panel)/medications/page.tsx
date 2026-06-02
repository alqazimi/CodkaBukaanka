import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { MedicationForm } from "@/components/admin/MedicationForm";
import { MedicationsManager } from "@/components/admin/MedicationsManager";
import { AdminCard, AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminMedicationsPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const medications = await serverApi.get<{ id: string; name: string; type?: string }[]>(
    "/api/admin/medications",
    { cache: "no-store", token: token ?? undefined }
  );

  return (
    <AdminPage>
      <AdminPageHeader title="Medications" description="Drugs and products referenced in incidents." />
      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <AdminCard className="lg:col-span-1">
          <MedicationForm />
        </AdminCard>
        <div className="lg:col-span-2">
          <MedicationsManager medications={medications ?? []} />
        </div>
      </div>
    </AdminPage>
  );
}
