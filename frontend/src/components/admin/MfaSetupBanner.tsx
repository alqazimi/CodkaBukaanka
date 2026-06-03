"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clientApi } from "@/lib/api";
import { navigateAdmin } from "@/lib/admin-router";

export function MfaSetupBanner() {
  const params = useSearchParams();
  const setupRequired = params.get("setup") === "1";
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!setupRequired) return;
    clientApi.get<{ enabled: boolean }>("/api/admin/security/mfa/status").then((data) => {
      if (data) setEnabled(data.enabled);
    });
  }, [setupRequired]);

  if (!setupRequired) return null;

  if (enabled === true) {
    return (
      <div
        role="status"
        className="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-950 dark:border-teal-800/60 dark:bg-teal-950/40 dark:text-teal-100"
      >
        <p className="font-medium">Two-factor authentication is enabled</p>
        <p className="mt-1 text-teal-900/90 dark:text-teal-200/90">
          Your account is protected. You can use cases, uploads, and the rest of the admin panel.
        </p>
        <button
          type="button"
          onClick={() => navigateAdmin("/admin")}
          className="mt-3 min-h-[44px] rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="font-medium">Two-factor authentication required</p>
      <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
        Enable the authenticator app below to unlock cases, uploads, and other admin tools. After you verify a code,
        you will be sent to the dashboard automatically.
      </p>
    </div>
  );
}
