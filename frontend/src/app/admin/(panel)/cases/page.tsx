import { requireAdmin } from "@/lib/admin-auth";
import { CasesAdminPanel } from "@/components/admin/CasesAdminPanel";
import { AdminPage, AdminPageHeader, adminBtnPrimary } from "@/components/admin/admin-ui";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminCasesPage() {
  await requireAdmin();

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
        <CasesAdminPanel />
      </div>
    </AdminPage>
  );
}
