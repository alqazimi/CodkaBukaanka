"use client";

import { useCallback, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ADMIN_IDLE_TIMEOUT_MS } from "@/lib/admin-session";

import { getPublicApiUrl } from "@/lib/env";

const API_URL = getPublicApiUrl();
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"] as const;

export function AdminIdleLogout() {
  const { status } = useSession();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // Best-effort: still clear NextAuth session below.
    }
    await signOut({ redirect: false });
    router.push("/admin/login?reason=idle");
    router.refresh();
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void logout();
    }, ADMIN_IDLE_TIMEOUT_MS);
  }, [logout]);

  useEffect(() => {
    if (status !== "authenticated") return;

    resetTimer();
    const onActivity = () => resetTimer();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
    };
  }, [status, resetTimer]);

  return null;
}
