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

/** Send admins to login when the backend JWT expired mid-session. */
export function redirectIfSessionExpired(result: {
  code?: string;
  error?: string | null;
}): void {
  if (result.code === "session_expired") {
    redirect("/admin/login?reason=expired");
  }
}
