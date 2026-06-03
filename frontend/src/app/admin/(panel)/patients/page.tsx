import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { PatientsSection } from "@/components/admin/PatientsSection";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminPatientsPage() {
  const session = await requireAdmin();
  const token = await getAccessToken();
  const patients = await serverApi.get<
    { id: string; fullName: string; age?: number; gender?: string; _count?: { cases: number } }[]
  >("/api/admin/patients", { cache: "no-store", token: token ?? undefined });

  return (
    <AdminPage>
      <AdminPageHeader title="Patients" description="Affected individuals linked to incident cases." />
      <PatientsSection initialPatients={patients ?? []} isOwner={session.user.role === "owner"} />
    </AdminPage>
  );
}
