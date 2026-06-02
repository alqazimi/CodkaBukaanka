import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { MedicationsSection } from "@/components/admin/MedicationsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

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
      <MedicationsSection initialMedications={medications ?? []} />
    </AdminPage>
  );
}
