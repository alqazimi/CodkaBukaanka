import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { auth } from "@/auth";
import { serverApi } from "@/lib/api";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminAuditPage() {
  await requireAdmin();
  const session = await auth();
  const token = await getAccessToken();
  const isOwner = session?.user?.role === "owner";

  const probe = await serverApi.get<{ canViewGlobalAudit: boolean }>("/api/admin/audit?limit=1", {
    cache: "no-store",
    token: token ?? undefined,
  });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Audit log"
        description={isOwner ? "Track actions across all admin accounts." : "Your recent actions on the platform."}
      />
      <div className="mt-6">
        <AuditLogPanel canViewGlobalAudit={probe?.canViewGlobalAudit ?? isOwner} />
      </div>
    </AdminPage>
  );
}
