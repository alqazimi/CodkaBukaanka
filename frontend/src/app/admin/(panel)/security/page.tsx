import { requireAdmin } from "@/lib/admin-auth";
import { MfaSecurityPanel } from "@/components/admin/MfaSecurityPanel";

export default async function AdminSecurityPage() {
  await requireAdmin();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900">Security Center</h1>
      <p className="text-sm text-navy-600">
        Manage account protection, including Authenticator app (TOTP) enrollment.
      </p>
      <div className="mt-6">
        <MfaSecurityPanel />
      </div>
    </div>
  );
}
