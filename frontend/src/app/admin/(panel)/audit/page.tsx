import { redirectIfSessionExpired, requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

type AuditItem = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
  admin?: { name: string; email: string } | null;
};

export default async function AdminAuditPage() {
  const session = await requireAdmin();
  const isOwner = session?.user?.role === "owner";

  const { data, error, code } = await adminServerGet<{
    items: AuditItem[];
    total: number;
    page: number;
    limit: number;
    canViewGlobalAudit: boolean;
  }>("/api/admin/audit?page=1&limit=50");
  redirectIfSessionExpired({ code, error });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Audit log"
        description={isOwner ? "Track actions across all admin accounts." : "Your recent actions on the platform."}
      />
      <div className="mt-6">
        {error ? <AdminApiErrorBanner message={error} /> : null}
        <AuditLogPanel
          canViewGlobalAudit={data?.canViewGlobalAudit ?? isOwner}
          initialData={data ? { items: data.items, total: data.total, page: data.page } : null}
          serverPrefetched={Boolean(data)}
        />
      </div>
    </AdminPage>
  );
}
