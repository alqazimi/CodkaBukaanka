import { requireAdmin } from "@/lib/admin-auth";
import { MfaSecurityPanel } from "@/components/admin/MfaSecurityPanel";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminSecurityPage() {
  await requireAdmin();

  return (
    <AdminPage>
      <AdminPageHeader
        title="Security Center"
        description="Manage account protection, including Authenticator app (TOTP) enrollment."
      />
      <div className="mt-6">
        <MfaSecurityPanel />
      </div>
    </AdminPage>
  );
}
