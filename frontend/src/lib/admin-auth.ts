import { redirect } from "next/navigation";
import { adminServerGet } from "@/lib/server-admin-api";
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

  // Trust session after MFA is enabled — avoids a Railway round-trip on every admin navigation.
  if (session.requiresMfaSetup === false) {
    return false;
  }

  const token = await getCachedAccessToken();
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
    return session.requiresMfaSetup === true;
  }

  return true;
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
