"use client";

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { navigateAfterLogin } from "@/lib/admin-router";
import {
  getLoginErrorMessage,
  loginErrorNeedsCaptcha,
  resolveLoginErrorCode,
} from "@/lib/login-error-message";
import { AdminLocaleToggle } from "@/components/admin/AdminLocaleToggle";
import { hasTurnstileSiteKey, TurnstileWidget } from "@/components/admin/TurnstileWidget";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { AlertCircle, ArrowLeft, Shield } from "lucide-react";

const turnstileEnabled = hasTurnstileSiteKey();

type LoginStep = "credentials" | "mfa";

type SavedCredentials = {
  email: string;
  password: string;
};

function stripSensitiveQueryParams() {
  const url = new URL(window.location.href);
  const hadSecrets =
    url.searchParams.has("email") ||
    url.searchParams.has("password") ||
    url.searchParams.has("captchaToken");
  if (!hadSecrets) return;

  url.searchParams.delete("email");
  url.searchParams.delete("password");
  url.searchParams.delete("captchaToken");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
}

export default function AdminLoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials");
  const [savedCredentials, setSavedCredentials] = useState<SavedCredentials | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(turnstileEnabled);

  useEffect(() => {
    stripSensitiveQueryParams();
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

  function resetToCredentials() {
    setStep("credentials");
    setSavedCredentials(null);
    setError("");
  }

  async function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
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

    if (apiCode === "mfa_required") {
      setSavedCredentials({ email, password });
      setStep("mfa");
      setCaptchaToken("");
      setError("");
      return;
    }

    const msg = getLoginErrorMessage(result.error, result.code);

    if (loginErrorNeedsCaptcha(msg, apiCode)) {
      setShowCaptcha(true);
      setCaptchaToken("");
      setTurnstileResetKey((k) => k + 1);
    }

    setError(msg);
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!savedCredentials) {
      resetToCredentials();
      return;
    }

    setError("");
    const form = new FormData(e.currentTarget);
    const totpToken = String(form.get("totpToken") ?? "").trim();

    if (!/^\d{6}$/.test(totpToken)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setLoading(true);
    const result = await signIn("credentials", {
      email: savedCredentials.email,
      password: savedCredentials.password,
      totpToken,
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
      resetToCredentials();
      setShowCaptcha(true);
      setCaptchaToken("");
      setTurnstileResetKey((k) => k + 1);
    }

    setError(msg);

    if (apiCode === "invalid_credentials") {
      resetToCredentials();
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-white/65 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to site
        </Link>
      </div>
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <AdminLocaleToggle variant="login" />
      </div>

      <div className="glass-panel w-full max-w-md animate-fade-in overflow-hidden border-red-400/20 p-0 shadow-[var(--shadow-elite)]">
        <div className="border-b border-white/10 bg-[linear-gradient(135deg,hsl(0_84%_55%/0.1),transparent_60%)] px-6 py-8 sm:px-8">
          <SiteLogo size="md" className="justify-center" />
          <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/35 bg-red-500/10">
            <Shield className="h-6 w-6 text-red-300" aria-hidden />
          </div>
          <h1 className="mt-5 text-center font-display text-2xl font-bold tracking-tight text-white">
            {step === "mfa" ? "Authenticator code" : "Login"}
          </h1>
          <p className="mt-2 text-center text-sm font-medium text-white/70">
            {step === "mfa"
              ? "Enter the 6-digit code from your authenticator app."
              : "Sign in with your email and password."}
          </p>
        </div>

        {step === "credentials" ? (
          <form method="post" onSubmit={handleCredentialsSubmit} className="space-y-5 px-6 py-8 sm:px-8">
            <div>
              <label htmlFor="admin-email" className="mb-1.5 block text-sm font-semibold text-white/85">
                Email
              </label>
              <input
                id="admin-email"
                name="email"
                type="email"
                required
                autoComplete="username email"
                className="input-base"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="mb-1.5 block text-sm font-semibold text-white/85">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="input-base"
                placeholder="Enter your password"
              />
            </div>
            {showCaptcha && turnstileEnabled && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-sm font-semibold text-white/85">Security check</p>
                <p className="mb-3 text-xs text-white/60">
                  Complete the verification below before signing in.
                </p>
                <TurnstileWidget
                  onToken={setCaptchaToken}
                  theme="dark"
                  resetKey={turnstileResetKey}
                />
              </div>
            )}
            {showCaptcha && !turnstileEnabled && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white/85">Verification</label>
                <input name="captchaToken" type="text" className="input-base" placeholder="Verification code" />
              </div>
            )}

            {sessionExpired && !error && (
              <p className="rounded-xl border border-amber-400/30 bg-amber-950/30 px-3 py-2.5 text-sm text-amber-100/90">
                Your session ended. Please sign in again.
              </p>
            )}
            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2.5 text-sm text-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-red-500/45 bg-[linear-gradient(135deg,hsl(0_84%_55%),hsl(0_75%_42%))] py-3 text-sm font-semibold text-white shadow-[var(--shadow-red-soft)] transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form method="post" onSubmit={handleMfaSubmit} className="space-y-5 px-6 py-8 sm:px-8">
            <div>
              <label htmlFor="admin-totp" className="mb-1.5 block text-sm font-semibold text-white/85">
                Authenticator code
              </label>
              <input
                id="admin-totp"
                name="totpToken"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                className="input-base text-center text-lg tracking-[0.35em]"
                placeholder="000000"
              />
            </div>

            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-950/30 px-3 py-2.5 text-sm text-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-red-500/45 bg-[linear-gradient(135deg,hsl(0_84%_55%),hsl(0_75%_42%))] py-3 text-sm font-semibold text-white shadow-[var(--shadow-red-soft)] transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Continue to dashboard"}
            </button>

            <button
              type="button"
              onClick={resetToCredentials}
              disabled={loading}
              className="w-full text-sm font-medium text-white/65 transition-colors hover:text-white disabled:opacity-50"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
