import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { CasesAdminTable } from "@/components/admin/CasesAdminTable";
import { AdminPage, AdminPageHeader, adminBtnPrimary } from "@/components/admin/admin-ui";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminCasesPage() {
  await requireAdmin();
  const token = await getAccessToken();

  const cases = await serverApi.get<
    { id: string; caseNumber: string; title: string; status: string; slug: string; hospital?: { name: string }; patient?: { fullName: string } }[]
  >("/api/admin/cases", { cache: "no-store", token: token ?? undefined });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Cases"
        description="Manage incident records, workflow status, and evidence."
        actions={
          <Link href="/admin/cases/new" className={adminBtnPrimary}>
            <Plus className="h-4 w-4" />
            New Case
          </Link>
        }
      />
      <div className="mt-6">
        <CasesAdminTable cases={cases ?? []} />
      </div>
    </AdminPage>
  );
}
