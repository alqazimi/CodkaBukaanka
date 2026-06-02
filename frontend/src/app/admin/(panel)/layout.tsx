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
    <div className="flex min-h-screen bg-navy-50">
      <AdminIdleLogout />
      <AdminNav />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
