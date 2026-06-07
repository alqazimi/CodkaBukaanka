"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

const ROUTES_TO_WARM = ["/", "/hospitals", "/patients", "/doctors", "/medications", "/about", "/submit-case", "/contact", "/search"] as const;

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    ROUTES_TO_WARM.forEach((route) => router.prefetch(route));
  }, [router]);

  return null;
}
