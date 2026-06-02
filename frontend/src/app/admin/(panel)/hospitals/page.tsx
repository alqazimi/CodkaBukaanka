import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { HospitalForm } from "@/components/admin/HospitalForm";
import { HospitalsManager } from "@/components/admin/HospitalsManager";
import { AdminCard, AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminHospitalsPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const hospitals = await serverApi.get<{ id: string; name: string; location: string; slug: string }[]>(
    "/api/admin/hospitals",
    { cache: "no-store", token: token ?? undefined }
  );

  return (
    <AdminPage>
      <AdminPageHeader title="Hospitals" description="Add and maintain facility records linked to cases." />
      <AdminCard className="mt-6">
        <HospitalForm />
      </AdminCard>
      <HospitalsManager hospitals={hospitals ?? []} />
    </AdminPage>
  );
}
