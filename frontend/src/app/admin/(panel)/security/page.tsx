import { Suspense } from "react";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { MfaSecurityPanel } from "@/components/admin/MfaSecurityPanel";
import { MfaSetupBanner } from "@/components/admin/MfaSetupBanner";

export default function AdminSecurityPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="Security Center"
        description="Set up Google Authenticator and manage session security for your admin account."
      />
      <div className="mt-6">
        <Suspense fallback={null}>
          <MfaSetupBanner />
        </Suspense>
        <MfaSecurityPanel />
      </div>
    </AdminPage>
  );
}
