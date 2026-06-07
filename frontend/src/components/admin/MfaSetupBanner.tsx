"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";
import { navigateAdmin } from "@/lib/admin-router";
import { adminBtnPrimary } from "@/components/admin/admin-ui";

export function MfaSetupBanner() {
  const params = useSearchParams();
  const { data: session } = useSession();
  const setupFromQuery = params.get("setup") === "1";
  const setupFromSession = (session as { requiresMfaSetup?: boolean } | null)?.requiresMfaSetup === true;
  const setupRequired = setupFromQuery || setupFromSession;
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setupInProgress, setSetupInProgress] = useState(false);

  useEffect(() => {
    if (!setupRequired) return;
    clientApi
      .get<{ enabled: boolean; setupInProgress: boolean }>("/api/admin/security/mfa/status")
      .then((data) => {
        if (!data) return;
        setEnabled(data.enabled);
        setSetupInProgress(data.setupInProgress);
      });
  }, [setupRequired]);

  if (!setupRequired) return null;

  if (enabled === true) {
    return (
      <div
        role="status"
        className="mb-6 rounded-xl border border-red-400/50 bg-red-950/40 px-4 py-3 text-sm text-white/90"
      >
        <p className="font-medium">Two-factor authentication is enabled</p>
        <p className="mt-1 text-red-200/90">
          Your account is protected. You can use cases, uploads, and the rest of the admin panel.
        </p>
        <button
          type="button"
          onClick={() => navigateAdmin("/admin")}
          className={`mt-3 ${adminBtnPrimary}`}
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-white/90"
    >
      <p className="font-medium">
        {setupInProgress ? "Finish activating Google Authenticator" : "Two-factor authentication required"}
      </p>
      <p className="mt-1 text-red-200/90 dark:text-red-200/90">
        {setupInProgress
          ? "You already connected Google Authenticator. Scroll to “Verify and enable”, enter your current 6-digit code once—do not scan a new QR unless codes keep failing."
          : "Enable the authenticator app below to unlock cases, uploads, and other admin tools. After you verify a code, you will be sent to the dashboard automatically."}
      </p>
    </div>
  );
}
