import { requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { DoctorsSection } from "@/components/admin/DoctorsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

export default async function AdminDoctorsPage() {
  await requireAdmin();
  const [doctorsRes, hospitalsRes] = await Promise.all([
    adminServerGet<
      { id: string; fullName: string; specialty?: string; hospital?: { name: string }; hospitalId?: string }[]
    >("/api/admin/doctors"),
    adminServerGet<{ id: string; name: string }[]>("/api/admin/hospitals"),
  ]);
  const loadError = doctorsRes.error ?? hospitalsRes.error;

  return (
    <AdminPage>
      <AdminPageHeader title="Doctors" description="Clinicians associated with hospitals and cases." />
      {loadError ? <AdminApiErrorBanner message={loadError} /> : null}
      <DoctorsSection initialDoctors={doctorsRes.data ?? []} hospitals={hospitalsRes.data ?? []} />
    </AdminPage>
  );
}
