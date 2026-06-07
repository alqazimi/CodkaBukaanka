"use client";

import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";
import {
  ADMIN_SESSION_REFRESH_STARTUP_GRACE_MS,
  ADMIN_TOKEN_REFRESH_INTERVAL_MS,
} from "@/lib/admin-session";
import { navigateAfterLogin } from "@/lib/admin-router";
import { setAdminSessionExpiredHandler } from "@/lib/admin-session-expired";

export function AdminSessionRefresh() {
  const { status, update, data: session } = useSession();
  const refreshingRef = useRef(false);
  const mountedAtRef = useRef(Date.now());
  const failedRefreshCountRef = useRef(0);
  const sessionHardExpMs = (session as { sessionHardExpMs?: number } | null)?.sessionHardExpMs;

  const signOutToLogin = useCallback(async (reason: "expired" | "idle") => {
    try {
      await fetch("/api/admin-proxy/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // Still clear NextAuth below.
    }
    await signOut({ redirect: false });
    navigateAfterLogin(`/admin/login?reason=${reason}`);
  }, []);

  const refreshToken = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    try {
      const res = await fetch("/api/admin/session/refresh", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        failedRefreshCountRef.current += 1;
        const inStartupGrace = Date.now() - mountedAtRef.current < ADMIN_SESSION_REFRESH_STARTUP_GRACE_MS;
        if (res.status === 401 && !inStartupGrace && failedRefreshCountRef.current >= 2) {
          await signOutToLogin("expired");
        }
        return;
      }
      failedRefreshCountRef.current = 0;
      const data = (await res.json()) as { accessToken?: string };
      if (data.accessToken) {
        await update({ accessToken: data.accessToken });
      }
    } finally {
      refreshingRef.current = false;
    }
  }, [signOutToLogin, update]);

  useEffect(() => {
    setAdminSessionExpiredHandler(() => {
      void signOutToLogin("expired");
    });
    return () => setAdminSessionExpiredHandler(null);
  }, [signOutToLogin]);

  useEffect(() => {
    if (status !== "authenticated" || !sessionHardExpMs) return;

    const msUntilLogout = sessionHardExpMs - Date.now();
    if (msUntilLogout <= 0) {
      void signOutToLogin("expired");
      return;
    }

    const timer = window.setTimeout(() => void signOutToLogin("expired"), msUntilLogout);
    return () => window.clearTimeout(timer);
  }, [status, sessionHardExpMs, signOutToLogin]);

  useEffect(() => {
    if (status !== "authenticated") return;

    mountedAtRef.current = Date.now();
    failedRefreshCountRef.current = 0;

    // Defer first refresh so it does not compete with the initial admin page load.
    const initialRefresh = window.setTimeout(() => void refreshToken(), 12_000);
    const onFocus = () => void refreshToken();
    const interval = setInterval(() => void refreshToken(), ADMIN_TOKEN_REFRESH_INTERVAL_MS);

    window.addEventListener("focus", onFocus);
    return () => {
      window.clearTimeout(initialRefresh);
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [status, refreshToken]);

  return null;
}
