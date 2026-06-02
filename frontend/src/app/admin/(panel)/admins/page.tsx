import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { AdminManager } from "@/components/admin/AdminManager";

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
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900">Admin Management</h1>
      <p className="text-sm text-navy-600">
        Manage roles and admin accounts. Use <span className="font-medium">Security</span> tab for MFA setup.
      </p>
      <div className="mt-6">
        <AdminManager
          admins={admins ?? []}
          currentAdminId={session.user.id}
          canCreateAdmins={currentRole === "owner"}
        />
      </div>
    </div>
  );
}
