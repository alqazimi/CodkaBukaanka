import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { PatientForm } from "@/components/admin/PatientForm";
import { PatientsManager } from "@/components/admin/PatientsManager";
import { AdminCard, AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminPatientsPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const patients = await serverApi.get<{ id: string; fullName: string; age?: number; gender?: string }[]>(
    "/api/admin/patients",
    { cache: "no-store", token: token ?? undefined }
  );

  return (
    <AdminPage>
      <AdminPageHeader title="Patients" description="Affected individuals linked to incident cases." />
      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <AdminCard className="lg:col-span-1">
          <PatientForm />
        </AdminCard>
        <div className="lg:col-span-2">
          <PatientsManager patients={patients ?? []} />
        </div>
      </div>
    </AdminPage>
  );
}
