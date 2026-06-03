import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { HospitalsSection } from "@/components/admin/HospitalsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminHospitalsPage() {
  const session = await requireAdmin();
  const token = await getAccessToken();
  const hospitals = await serverApi.get<
    { id: string; name: string; location: string; slug: string; description?: string | null; _count?: { cases: number; doctors: number } }[]
  >("/api/admin/hospitals", { cache: "no-store", token: token ?? undefined });

  return (
    <AdminPage>
      <AdminPageHeader title="Hospitals" description="Add and maintain facility records linked to cases." />
      <HospitalsSection initialHospitals={hospitals ?? []} isOwner={session.user.role === "owner"} />
    </AdminPage>
  );
}
