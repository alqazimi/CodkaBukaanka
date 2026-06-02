import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { DoctorsSection } from "@/components/admin/DoctorsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminDoctorsPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const [doctors, hospitals] = await Promise.all([
    serverApi.get<{ id: string; fullName: string; specialty?: string; hospital?: { name: string }; hospitalId?: string }[]>(
      "/api/admin/doctors",
      { cache: "no-store", token: token ?? undefined }
    ),
    serverApi.get<{ id: string; name: string }[]>("/api/admin/hospitals", {
      cache: "no-store",
      token: token ?? undefined,
    }),
  ]);

  return (
    <AdminPage>
      <AdminPageHeader title="Doctors" description="Clinicians associated with hospitals and cases." />
      <DoctorsSection initialDoctors={doctors ?? []} hospitals={hospitals ?? []} />
    </AdminPage>
  );
}
