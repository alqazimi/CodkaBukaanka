import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { CaseForm } from "@/components/admin/CaseForm";

export default async function NewCasePage() {
  await requireAdmin();
  const token = await getAccessToken();

  const [hospitals, patients, doctors, medications] = await Promise.all([
    serverApi.get<{ id: string; name: string }[]>("/api/admin/hospitals", { cache: "no-store", token: token ?? undefined }),
    serverApi.get<{ id: string; fullName: string }[]>("/api/admin/patients", { cache: "no-store", token: token ?? undefined }),
    serverApi.get<{ id: string; fullName: string }[]>("/api/admin/doctors", { cache: "no-store", token: token ?? undefined }),
    serverApi.get<{ id: string; name: string }[]>("/api/admin/medications", { cache: "no-store", token: token ?? undefined }),
  ]);

  return (
    <div className="p-6 sm:p-8">
      <div className="rounded-2xl border border-navy-200/70 bg-gradient-to-br from-white to-navy-50/40 p-6 shadow-soft">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-navy-900">Create Case</h1>
        <p className="mt-2 text-sm text-navy-600">Fill in verified incident details and publish only after review.</p>
      </div>
      <div className="mt-8">
        <CaseForm
          hospitals={hospitals ?? []}
          patients={patients ?? []}
          doctors={doctors ?? []}
          medications={medications ?? []}
        />
      </div>
    </div>
  );
}
