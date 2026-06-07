"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { navigateAfterLogin } from "@/lib/admin-router";
import {
  getLoginErrorMessage,
  loginErrorNeedsCaptcha,
  resolveLoginErrorCode,
} from "@/lib/login-error-message";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AdminLocaleToggle } from "@/components/admin/AdminLocaleToggle";
import { hasTurnstileSiteKey, TurnstileWidget } from "@/components/admin/TurnstileWidget";
import { AlertCircle, Shield } from "lucide-react";

const turnstileEnabled = hasTurnstileSiteKey();

export default function AdminLoginPage() {
  const [idleLogout, setIdleLogout] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(turnstileEnabled);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    setIdleLogout(reason === "idle");
    setSessionExpired(reason === "expired");
  }, []);

  async function completeLoginNavigation() {
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      await fetch("/api/admin/session/refresh", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      // Layout can recover within the refresh grace window.
    }
    navigateAfterLogin("/admin");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (showCaptcha && turnstileEnabled && !captchaToken) {
      setError("Complete the security check below, then try again.");
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      captchaToken: captchaToken || undefined,
      redirect: false,
    });

    if (!result?.error) {
      await completeLoginNavigation();
      return;
    }

    setLoading(false);
    const apiCode = resolveLoginErrorCode(result.error, result.code);
    const msg = getLoginErrorMessage(result.error, result.code);

    if (loginErrorNeedsCaptcha(msg, apiCode)) {
      setShowCaptcha(true);
      setCaptchaToken("");
      setTurnstileResetKey((k) => k + 1);
    }

    setError(msg);
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] dark:from-navy-950 dark:via-navy-950 dark:to-black">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <AdminLocaleToggle variant="login" />
        <ThemeToggle variant="ghost" />
      </div>
      <div className="w-full max-w-md animate-fade-in rounded-2xl border border-navy-100/10 bg-white p-6 shadow-card-hover dark:border-navy-700/50 dark:bg-navy-900 sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy-900 dark:text-white">Administrator Login</h1>
        <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">Sign in with your email and password.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input-base"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">Password</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="input-base"
              placeholder="Enter your password"
            />
          </div>
          {showCaptcha && turnstileEnabled && (
            <div className="overflow-hidden rounded-lg border border-navy-100 bg-white p-3 dark:border-navy-700 dark:bg-navy-950/40">
              <TurnstileWidget
                onToken={setCaptchaToken}
                theme="auto"
                resetKey={turnstileResetKey}
              />
            </div>
          )}
          {showCaptcha && !turnstileEnabled && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">
                Verification
              </label>
              <input name="captchaToken" type="text" className="input-base" placeholder="Verification code" />
            </div>
          )}

          {idleLogout && !error && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              You were signed out due to inactivity. Please sign in again.
            </p>
          )}
          {sessionExpired && !error && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              Your 3-hour session ended. Please sign in again.
            </p>
          )}
          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700 hover:shadow-md disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
