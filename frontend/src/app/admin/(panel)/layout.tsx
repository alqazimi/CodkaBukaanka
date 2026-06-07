import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { adminMustCompleteMfaSetup } from "@/lib/admin-auth";
import { getCachedAccessToken, getCachedAdminSession } from "@/lib/cached-admin-auth";
import { isBackendTokenExpired } from "@/lib/jwt-expiry";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminIdleLogout } from "@/components/admin/AdminIdleLogout";
import { AdminSessionRefresh } from "@/components/admin/AdminSessionRefresh";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [session, headerList, token] = await Promise.all([
    getCachedAdminSession(),
    headers(),
    getCachedAccessToken(),
  ]);

  if (!session?.user) {
    redirect("/admin/login");
  }

  const pathname = headerList.get("x-pathname") ?? "";

  if (!token) {
    redirect("/admin/login");
  }

  if (isBackendTokenExpired(token)) {
    redirect("/admin/login?reason=expired");
  }
  const sessionWithToken = session as { requiresMfaSetup?: boolean };
  const mustSetupMfa = await adminMustCompleteMfaSetup(sessionWithToken);
  const onSecurityPage = pathname.includes("/admin/security");

  if (mustSetupMfa && !onSecurityPage) {
    redirect("/admin/security?setup=1");
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-navy-50 dark:bg-navy-950 lg:flex-row">
      <AdminIdleLogout />
      <AdminSessionRefresh />
      <AdminNav />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>
  );
}
