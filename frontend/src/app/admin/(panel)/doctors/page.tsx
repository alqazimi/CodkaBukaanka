import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { DoctorForm } from "@/components/admin/DoctorForm";
import { DoctorsManager } from "@/components/admin/DoctorsManager";
import { AdminCard, AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminDoctorsPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const [doctors, hospitals] = await Promise.all([
    serverApi.get<{ id: string; fullName: string; specialty?: string; hospital?: { name: string } }[]>(
      "/api/admin/doctors",
      { cache: "no-store", token: token ?? undefined }
    ),
    serverApi.get<{ id: string; name: string }[]>("/api/admin/hospitals", { cache: "no-store", token: token ?? undefined }),
  ]);

  return (
    <AdminPage>
      <AdminPageHeader title="Doctors" description="Clinicians associated with hospitals and cases." />
      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <AdminCard className="lg:col-span-1">
          <DoctorForm hospitals={hospitals ?? []} />
        </AdminCard>
        <div className="lg:col-span-2">
          <DoctorsManager doctors={doctors ?? []} hospitals={hospitals ?? []} />
        </div>
      </div>
    </AdminPage>
  );
}
