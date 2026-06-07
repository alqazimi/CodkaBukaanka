import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { DoctorsSection } from "@/components/admin/DoctorsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

type DoctorsPageData = {
  doctors: { id: string; fullName: string; specialty?: string; hospital?: { name: string }; hospitalId?: string }[];
  hospitals: { id: string; name: string }[];
};

export default async function AdminDoctorsPage() {
  const { data, error, code } = await adminServerGet<DoctorsPageData>("/api/admin/doctors?includeHospitals=1");
  redirectIfSessionExpired({ code, error });

  return (
    <AdminPage>
      <AdminPageHeader title="Doctors" description="Clinicians associated with hospitals and cases." />
      {error ? <AdminApiErrorBanner message={error} /> : null}
      <DoctorsSection initialDoctors={data?.doctors ?? []} hospitals={data?.hospitals ?? []} />
    </AdminPage>
  );
}
