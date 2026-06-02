"use client";

import { startTransition } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/** Full navigation so cookies and server layout run reliably (avoids blank client transitions). */
export function navigateAdmin(target: string) {
  window.location.assign(target);
}

export function navigateAfterLogin(target = "/admin") {
  navigateAdmin(target);
}

/** Refresh server components without blanking the page during the transition. */
export function refreshAdminPage(router: AppRouterInstance) {
  startTransition(() => {
    router.refresh();
  });
}
