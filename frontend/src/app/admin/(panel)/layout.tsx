import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getAccessToken } from "@/auth";
import { adminMustCompleteMfaSetup } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminIdleLogout } from "@/components/admin/AdminIdleLogout";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const token = await getAccessToken();
  if (!token) {
    redirect("/admin/login");
  }

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const sessionWithToken = session as { requiresMfaSetup?: boolean };
  const mustSetupMfa = await adminMustCompleteMfaSetup(sessionWithToken);
  const onSecurityPage =
    pathname.includes("/admin/security") ||
    (pathname === "" && headerList.get("referer")?.includes("/admin/security"));

  if (mustSetupMfa && !onSecurityPage) {
    redirect("/admin/security?setup=1");
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-navy-50 dark:bg-navy-950 lg:flex-row">
      <AdminIdleLogout />
      <AdminNav />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>
  );
}
