"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

const ROUTES_TO_WARM = ["/", "/search", "/contact"] as const;

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const prefetchRoutes = (): void => {
      if (cancelled) return;
      ROUTES_TO_WARM.forEach((route) => router.prefetch(route));
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetchRoutes, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timeoutId: ReturnType<typeof setTimeout> = setTimeout(prefetchRoutes, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [router]);

  return null;
}
