import { auth, getAccessToken } from "@/auth";
import { redirect } from "next/navigation";
import { serverApi } from "@/lib/api";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/admin/login");
  }
  const token = await getAccessToken();
  if (!token) {
    // Session cookie exists but backend JWT missing — log in again
    redirect("/admin/login");
  }
  return session;
}

/** Live MFA status — JWT `requiresMfaSetup` is only set at login and goes stale after MFA is enabled. */
export async function adminMustCompleteMfaSetup(session: {
  requiresMfaSetup?: boolean;
}): Promise<boolean> {
  if (session.requiresMfaSetup !== true) return false;

  const token = await getAccessToken();
  if (!token) return true;

  const status = await serverApi.get<{ enabled: boolean }>("/api/admin/security/mfa/status", {
    token,
    cache: "no-store",
  });
  return !status?.enabled;
}

export { getAccessToken };
