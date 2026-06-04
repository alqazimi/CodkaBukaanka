import { auth, getAccessToken } from "@/auth";
import { redirect } from "next/navigation";
import { adminServerGet } from "@/lib/server-admin-api";

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

function isMfaEnforced(): boolean {
  return process.env.NODE_ENV === "production" || process.env.ENFORCE_ADMIN_TOTP === "true";
}

/** Live MFA status — JWT `requiresMfaSetup` is only set at login and goes stale after MFA is enabled. */
export async function adminMustCompleteMfaSetup(session: {
  requiresMfaSetup?: boolean;
}): Promise<boolean> {
  if (!isMfaEnforced()) {
    return session.requiresMfaSetup === true;
  }

  const token = await getAccessToken();
  if (!token) return true;

  const { data: status, error, code } = await adminServerGet<{ enabled: boolean }>(
    "/api/admin/security/mfa/status"
  );

  if (status?.enabled) return false;

  if (status && !status.enabled) return true;

  if (code === "mfa_setup_required") return true;

  if (!status) {
    if (error) {
      console.warn("[admin-auth] MFA status check failed:", error);
    }
    return session.requiresMfaSetup !== false;
  }

  return true;
}

/** Send admins to Security when API calls are blocked until TOTP is enabled. */
export function redirectIfMfaSetupRequired(result: {
  code?: string;
  error?: string | null;
}): void {
  if (result.code === "mfa_setup_required") {
    redirect("/admin/security?setup=1");
  }
  if (result.error?.includes("MFA setup")) {
    redirect("/admin/security?setup=1");
  }
}

export { getAccessToken };
