import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_REFRESH_GRACE_MS } from "@/lib/admin-session";
import { getCachedAccessToken, getCachedAdminSession } from "@/lib/cached-admin-auth";
import { getJwtExpiryMs, isBackendTokenExpired } from "@/lib/jwt-expiry";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminPanelShell } from "@/components/admin/AdminPanelShell";
import { logger } from "@/lib/logger";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [session, headerList, token] = await Promise.all([
    getCachedAdminSession(),
    headers(),
    getCachedAccessToken(),
  ]);

  const pathname = headerList.get("x-pathname") ?? "";

  if (!session?.user) {
    logger.debug("[admin][layout] missing session user — redirect login", pathname);
    redirect("/admin/login?reason=session");
  }

  if (!token) {
    logger.debug("[admin][layout] missing backend token — redirect login", pathname);
    redirect("/admin/login?reason=session");
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

  const requiresMfaSetup =
    (session as { requiresMfaSetup?: boolean }).requiresMfaSetup === true;
  if (requiresMfaSetup && !pathname.startsWith("/admin/security")) {
    redirect("/admin/security?setup=1");
  }

  return (
    <AdminPanelShell>
      <div className="flex min-h-screen min-w-0 flex-col lg:flex-row">
        <AdminNav />
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
      </div>
    </AdminPanelShell>
  );
}
