"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { navigateAfterLogin } from "@/lib/admin-router";
import { getLoginErrorMessage, loginErrorNeedsCaptcha } from "@/lib/login-error-message";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AdminLocaleToggle } from "@/components/admin/AdminLocaleToggle";
import { AlertCircle, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [idleLogout, setIdleLogout] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    setIdleLogout(reason === "idle");
    setSessionExpired(reason === "expired");
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      totpToken: form.get("totpToken"),
      captchaToken: form.get("captchaToken"),
      redirect: false,
    });

    if (result?.error) {
      setLoading(false);
      const msg = getLoginErrorMessage(result.error, result.code);
      setError(msg);
      if (loginErrorNeedsCaptcha(msg, result.code)) setShowCaptcha(true);
    } else {
      navigateAfterLogin("/admin");
    }
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
        <p className="mt-2 text-sm text-navy-500 dark:text-navy-400">
          CodkaBukaanka — Admin access only. MFA is required for secured accounts.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">Email</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="input-base"
              placeholder="admin@company.com"
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">Authenticator code (TOTP)</label>
            <input
              name="totpToken"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              className="input-base"
              autoComplete="one-time-code"
            />
            <p className="mt-1 text-xs text-navy-500">
              Use the code from Google Authenticator for this email. If you already connected the app before, enter that
              code here every sign-in—no new QR scan needed once it works.
            </p>
          </div>

          {showCaptcha && (
            <div className="rounded-lg border border-navy-100 bg-navy-50 p-3 dark:border-navy-700 dark:bg-navy-800/80">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-navy-600 dark:text-navy-400">
                Verification token
              </label>
              <input
                name="captchaToken"
                type="text"
                className="input-base"
                placeholder="Paste captcha token"
              />
              <p className="mt-1 text-xs text-navy-500">
                Only required when extra verification is requested.
              </p>
            </div>
          )}

          {idleLogout && !error && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              You were signed out after 28 minutes of inactivity. Please sign in again.
            </p>
          )}
          {sessionExpired && !error && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your session expired. Please sign in again to continue.
            </p>
          )}
        {error && (
            <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {!showCaptcha && (
            <button
              type="button"
              onClick={() => setShowCaptcha(true)}
              className="text-xs text-navy-500 underline-offset-2 hover:text-teal-700 hover:underline"
            >
              Need verification token field?
            </button>
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
