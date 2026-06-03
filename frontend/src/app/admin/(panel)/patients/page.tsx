import { requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { PatientsSection } from "@/components/admin/PatientsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

export default async function AdminPatientsPage() {
  const session = await requireAdmin();
  const { data: patients, error } = await adminServerGet<
    { id: string; fullName: string; age?: number; gender?: string; _count?: { cases: number } }[]
  >("/api/admin/patients");

  return (
    <AdminPage>
      <AdminPageHeader title="Patients" description="Affected individuals linked to incident cases." />
      {error ? <AdminApiErrorBanner message={error} /> : null}
      <PatientsSection initialPatients={patients ?? []} isOwner={session.user.role === "owner"} />
    </AdminPage>
  );
}
