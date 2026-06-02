import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { PatientForm } from "@/components/admin/PatientForm";
import { PatientsManager } from "@/components/admin/PatientsManager";

export default async function AdminPatientsPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const patients = await serverApi.get<{ id: string; fullName: string; age?: number; gender?: string }[]>(
    "/api/admin/patients",
    { cache: "no-store", token: token ?? undefined }
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900">Patients</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1"><PatientForm /></div>
        <div className="lg:col-span-2">
          <PatientsManager patients={patients ?? []} />
        </div>
      </div>
    </div>
  );
}
