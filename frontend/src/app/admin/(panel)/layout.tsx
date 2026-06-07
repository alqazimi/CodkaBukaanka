import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_REFRESH_GRACE_MS } from "@/lib/admin-session";
import { getCachedAccessToken, getCachedAdminSession } from "@/lib/cached-admin-auth";
import { getJwtExpiryMs, isBackendTokenExpired } from "@/lib/jwt-expiry";
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
    const exp = getJwtExpiryMs(token);
    const expiredForMs = exp ? Date.now() - exp : Number.POSITIVE_INFINITY;
    const next = pathname.startsWith("/admin") ? pathname : "/admin";
    if (expiredForMs <= ADMIN_SESSION_REFRESH_GRACE_MS) {
      redirect(`/api/admin/session/refresh?next=${encodeURIComponent(next)}`);
    }
    redirect("/admin/login?reason=expired");
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
