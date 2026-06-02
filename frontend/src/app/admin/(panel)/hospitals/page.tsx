import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { HospitalForm } from "@/components/admin/HospitalForm";
import { HospitalsManager } from "@/components/admin/HospitalsManager";

export default async function AdminHospitalsPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const hospitals = await serverApi.get<{ id: string; name: string; location: string; slug: string }[]>(
    "/api/admin/hospitals",
    { cache: "no-store", token: token ?? undefined }
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900">Hospitals</h1>
      <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
        <HospitalForm />
      </div>
      <HospitalsManager hospitals={hospitals ?? []} />
    </div>
  );
}
