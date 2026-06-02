import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { AdminManager } from "@/components/admin/AdminManager";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

type AdminRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export default async function AdminAccountsPage() {
  const session = await requireAdmin();
  const token = await getAccessToken();
  const currentRole = (session.user as { role?: string }).role ?? "admin";
  const admins = currentRole === "owner"
    ? await serverApi.get<AdminRow[]>("/api/admin/admins", {
      cache: "no-store",
      token: token ?? undefined,
    })
    : [];

  return (
    <AdminPage>
      <AdminPageHeader
        title="Admin Management"
        description="Manage roles and accounts. Use Security for MFA setup."
      />
      <div className="mt-6">
        <AdminManager
          admins={admins ?? []}
          currentAdminId={session.user.id}
          canCreateAdmins={currentRole === "owner"}
        />
      </div>
    </AdminPage>
  );
}
