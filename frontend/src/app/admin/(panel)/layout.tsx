import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminIdleLogout } from "@/components/admin/AdminIdleLogout";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const requiresMfaSetup = (session as { requiresMfaSetup?: boolean }).requiresMfaSetup === true;

  if (requiresMfaSetup && !pathname.startsWith("/admin/security")) {
    redirect("/admin/security?setup=1");
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-navy-50 lg:flex-row">
      <AdminIdleLogout />
      <AdminNav />
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>
  );
}
