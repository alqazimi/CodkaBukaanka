"use client";

import { useSearchParams } from "next/navigation";

export function MfaSetupBanner() {
  const params = useSearchParams();
  if (params.get("setup") !== "1") return null;

  return (
    <div
      role="status"
      className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="font-medium">Two-factor authentication required</p>
      <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
        Enable the authenticator app below to unlock cases, uploads, and other admin tools. After you verify a code,
        you can leave this page without being sent back here.
      </p>
    </div>
  );
}
