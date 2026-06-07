import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { getCachedAdminSession } from "@/lib/cached-admin-auth";
import { HospitalsSection } from "@/components/admin/HospitalsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

export default async function AdminHospitalsPage() {
  const [session, hospitalsRes] = await Promise.all([
    getCachedAdminSession(),
    adminServerGet<
      { id: string; name: string; location: string; slug: string; description?: string | null; _count?: { cases: number; doctors: number } }[]
    >("/api/admin/hospitals"),
  ]);
  const { data: hospitals, error, code } = hospitalsRes;
  redirectIfSessionExpired({ code, error });

  return (
    <AdminPage>
      <AdminPageHeader title="Hospitals" description="Add and maintain facility records linked to cases." />
      {error ? <AdminApiErrorBanner message={error} /> : null}
      <HospitalsSection initialHospitals={hospitals ?? []} isOwner={session?.user?.role === "owner"} />
    </AdminPage>
  );
}
