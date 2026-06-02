import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { MedicationForm } from "@/components/admin/MedicationForm";
import { MedicationsManager } from "@/components/admin/MedicationsManager";

export default async function AdminMedicationsPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const medications = await serverApi.get<{ id: string; name: string; type?: string }[]>(
    "/api/admin/medications",
    { cache: "no-store", token: token ?? undefined }
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900">Medications</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1"><MedicationForm /></div>
        <div className="lg:col-span-2">
          <MedicationsManager medications={medications ?? []} />
        </div>
      </div>
    </div>
  );
}
