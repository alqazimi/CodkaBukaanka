import { requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { AdminManager } from "@/components/admin/AdminManager";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

type AdminRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export default async function AdminAccountsPage() {
  const session = await requireAdmin();
  const currentRole = (session.user as { role?: string }).role ?? "admin";
  const { data: admins, error } =
    currentRole === "owner"
      ? await adminServerGet<AdminRow[]>("/api/admin/admins")
      : { data: [] as AdminRow[], error: null };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Admin Management"
        description="Manage roles and accounts. Owner can create admins and access the recycle bin."
      />
      <div className="mt-6">
        {error ? <AdminApiErrorBanner message={error} /> : null}
        <AdminManager
          admins={admins ?? []}
          currentAdminId={session.user.id}
          canCreateAdmins={currentRole === "owner"}
          isOwner={currentRole === "owner"}
        />
      </div>
    </AdminPage>
  );
}
