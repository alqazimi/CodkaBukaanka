import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { DoctorForm } from "@/components/admin/DoctorForm";
import { DoctorsManager } from "@/components/admin/DoctorsManager";

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
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900">Doctors</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1"><DoctorForm hospitals={hospitals ?? []} /></div>
        <div className="lg:col-span-2">
          <DoctorsManager doctors={doctors ?? []} hospitals={hospitals ?? []} />
        </div>
      </div>
    </div>
  );
}
