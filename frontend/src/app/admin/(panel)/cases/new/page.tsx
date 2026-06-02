import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { CaseForm } from "@/components/admin/CaseForm";
import { AdminHero, AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

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
    <AdminPage>
      <AdminHero>
        <AdminPageHeader
          title="Create Case"
          description="Fill in verified incident details and publish only after review."
          className="!flex-col !gap-2"
        />
      </AdminHero>
      <div className="mt-6 sm:mt-8">
        <CaseForm
          hospitals={hospitals ?? []}
          patients={patients ?? []}
          doctors={doctors ?? []}
          medications={medications ?? []}
        />
      </div>
    </AdminPage>
  );
}
