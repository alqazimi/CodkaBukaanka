"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { navigateAfterLogin } from "@/lib/admin-router";
import {
  getLoginErrorMessage,
  loginErrorNeedsCaptcha,
  resolveLoginErrorCode,
} from "@/lib/login-error-message";
import { AdminLocaleToggle } from "@/components/admin/AdminLocaleToggle";
import { hasTurnstileSiteKey, TurnstileWidget } from "@/components/admin/TurnstileWidget";
import { AlertCircle, Shield } from "lucide-react";

const turnstileEnabled = hasTurnstileSiteKey();

export default function AdminLoginPage() {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(turnstileEnabled);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    setSessionExpired(reason === "expired" || reason === "idle");
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
    const session = await getSession();
    const requiresMfaSetup =
      (session as { requiresMfaSetup?: boolean } | null)?.requiresMfaSetup === true;
    navigateAfterLogin(requiresMfaSetup ? "/admin/security?setup=1" : "/admin");
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
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">
        <AdminLocaleToggle variant="login" />
      </div>
      <div className="glass-panel w-full max-w-md animate-fade-in p-6 sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/30 bg-red-950/30 text-red-200">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-hero font-serif text-2xl font-bold">Administrator Login</h1>
        <p className="mt-2 text-sm text-muted">Sign in with your email and password.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-white/85">Email</label>
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
            <label className="mb-1.5 block text-sm font-semibold text-white/85">Password</label>
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
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3">
              <TurnstileWidget
                onToken={setCaptchaToken}
                theme="dark"
                resetKey={turnstileResetKey}
              />
            </div>
          )}
          {showCaptcha && !turnstileEnabled && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/85">
                Verification
              </label>
              <input name="captchaToken" type="text" className="input-base" placeholder="Verification code" />
            </div>
          )}

          {sessionExpired && !error && (
            <p className="rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-white/90">
              Your session ended. Please sign in again.
            </p>
          )}
          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-950/30 px-3 py-2 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-red-500/45 bg-red-600/70 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-red-400 hover:bg-red-600/85 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
