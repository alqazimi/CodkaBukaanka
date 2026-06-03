import { requireAdmin } from "@/lib/admin-auth";
import { auth } from "@/auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

export default async function AdminAuditPage() {
  await requireAdmin();
  const session = await auth();
  const isOwner = session?.user?.role === "owner";

  const { data: probe, error } = await adminServerGet<{ canViewGlobalAudit: boolean }>(
    "/api/admin/audit?limit=1"
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Audit log"
        description={isOwner ? "Track actions across all admin accounts." : "Your recent actions on the platform."}
      />
      <div className="mt-6">
        {error ? <AdminApiErrorBanner message={error} /> : null}
        <AuditLogPanel canViewGlobalAudit={probe?.canViewGlobalAudit ?? isOwner} />
      </div>
    </AdminPage>
  );
}
