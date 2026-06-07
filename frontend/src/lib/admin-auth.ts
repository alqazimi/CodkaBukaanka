import { redirect } from "next/navigation";
import { getCachedAccessToken, getCachedAdminSession } from "@/lib/cached-admin-auth";

export async function requireAdmin() {
  const session = await getCachedAdminSession();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }
  const token = await getCachedAccessToken();
  if (!token) {
    redirect("/admin/login");
  }
  return session;
}

/** Send admins to login when the backend JWT expired or access is rejected. */
export function redirectIfSessionExpired(result: {
  code?: string;
  error?: string | null;
}): void {
  if (result.code === "session_expired") {
    redirect("/admin/login?reason=expired");
  }
  if (result.code === "mfa_setup_required") {
    redirect("/admin/security?setup=1");
  }
  if (result.code === "invalid_admin_role" || result.code === "admin_access_denied") {
    redirect("/admin/login?reason=expired");
  }
  if (result.error?.includes("Sign out") || result.error?.includes("sign in again")) {
    redirect("/admin/login?reason=expired");
  }
}
