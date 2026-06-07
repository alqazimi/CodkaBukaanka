"use client";

import { signIn } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { navigateAfterLogin } from "@/lib/admin-router";
import {
  getLoginErrorMessage,
  loginErrorNeedsCaptcha,
  resolveLoginErrorCode,
} from "@/lib/login-error-message";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AdminLocaleToggle } from "@/components/admin/AdminLocaleToggle";
import { hasTurnstileSiteKey, TurnstileWidget } from "@/components/admin/TurnstileWidget";
import { AlertCircle, ArrowLeft, Shield } from "lucide-react";

const turnstileEnabled = hasTurnstileSiteKey();

type LoginStep = "form" | "security" | "owner_totp";

export default function AdminLoginPage() {
  const totpRef = useRef<HTMLInputElement>(null);
  const lastCaptchaLoginRef = useRef<string | null>(null);
  const [idleLogout, setIdleLogout] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("form");
  const [savedEmail, setSavedEmail] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    setIdleLogout(reason === "idle");
    setSessionExpired(reason === "expired");
  }, []);

  useEffect(() => {
    if (step === "owner_totp") {
      totpRef.current?.focus();
    }
  }, [step]);

  const handleCaptchaToken = useCallback((token: string) => {
    setCaptchaToken(token);
    if (!token && step === "owner_totp") {
      setNotice("Security check expired. Complete it again before signing in.");
    }
  }, [step]);

  async function attemptSignIn(
    email: string,
    password: string,
    totpToken: string,
    token: string
  ) {
    return signIn("credentials", {
      email,
      password,
      totpToken: totpToken || undefined,
      captchaToken: token || undefined,
      redirect: false,
    });
  }

  async function completeLoginNavigation() {
    await new Promise((resolve) => setTimeout(resolve, 150));
    try {
      await fetch("/api/admin/session/refresh", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      // Layout can still recover within the refresh grace window.
    }
    navigateAfterLogin("/admin");
  }

  const finishLogin = useCallback(
    async (totpToken: string) => {
      setLoading(true);
      setError("");
      setNotice("");

      const result = await attemptSignIn(savedEmail, savedPassword, totpToken, captchaToken);
      if (!result?.error) {
        await completeLoginNavigation();
        return;
      }

      setLoading(false);
      const apiCode = resolveLoginErrorCode(result.error, result.code);
      const msg = getLoginErrorMessage(result.error, result.code);

      if (loginErrorNeedsCaptcha(msg, apiCode)) {
        beginSecurityStep(
          savedEmail,
          savedPassword,
          "Security check required. Complete the box below, then try again."
        );
        return;
      }

      if (apiCode === "mfa_invalid") {
        setStep("owner_totp");
        setNotice("Owner account: enter the current 6-digit code from Google Authenticator.");
        setError(msg);
        if (totpRef.current) totpRef.current.value = "";
        totpRef.current?.focus();
        return;
      }

      setError(msg);
      if (apiCode === "invalid_credentials") {
        setStep("form");
      }
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps -- beginSecurityStep is stable enough for login flow
    [savedEmail, savedPassword, captchaToken]
  );

  function beginSecurityStep(email: string, password: string, message?: string) {
    setSavedEmail(email);
    setSavedPassword(password);
    setCaptchaToken("");
    lastCaptchaLoginRef.current = null;
    setTurnstileResetKey((k) => k + 1);
    setStep("security");
    setError("");
    setNotice(message ?? "Complete the security check to continue.");
  }

  useEffect(() => {
    if (step !== "security" || !turnstileEnabled || !captchaToken) return;
    if (lastCaptchaLoginRef.current === captchaToken) return;
    lastCaptchaLoginRef.current = captchaToken;
    void finishLogin("");
  }, [step, captchaToken, turnstileEnabled, finishLogin]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (step === "owner_totp") {
      const totpToken = String(form.get("totpToken") ?? "").trim();
      if (!/^\d{6}$/.test(totpToken)) {
        setError("Enter the current 6-digit code from Google Authenticator.");
        return;
      }
      if (!captchaToken) {
        setStep("security");
        setError("Complete the security check, then enter your owner authenticator code.");
        return;
      }
      await finishLogin(totpToken);
      return;
    }

    if (step === "security" && !turnstileEnabled) {
      const manualCaptcha = String(form.get("captchaToken") ?? "").trim();
      if (!manualCaptcha) {
        setError("Enter the verification token to continue.");
        return;
      }
      setCaptchaToken(manualCaptcha);
      await finishLogin("");
      return;
    }

    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setSavedEmail(email);
    setSavedPassword(password);

    if (turnstileEnabled) {
      beginSecurityStep(email, password);
      return;
    }

    setLoading(true);
    setError("");
    setNotice("");
    const result = await attemptSignIn(email, password, "", "");
    if (!result?.error) {
      await completeLoginNavigation();
      return;
    }
    setLoading(false);
    const apiCode = resolveLoginErrorCode(result.error, result.code);
    const msg = getLoginErrorMessage(result.error, result.code);
    if (loginErrorNeedsCaptcha(msg, apiCode)) {
      beginSecurityStep(email, password, "Security check required before sign-in.");
      return;
    }
    if (apiCode === "mfa_invalid") {
      setStep("owner_totp");
      setNotice("Owner account: enter the current 6-digit code from Google Authenticator.");
      setError(msg);
      return;
    }
    setError(msg);
  }

  function goBackToForm() {
    setStep("form");
    setError("");
    setNotice("");
    setCaptchaToken("");
    lastCaptchaLoginRef.current = null;
    setTurnstileResetKey((k) => k + 1);
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
          {step === "form" && "Admin: email and password. Owner: also requires Google Authenticator."}
          {step === "security" && "Security check"}
          {step === "owner_totp" && "Owner — Authenticator code"}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {step === "form" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  defaultValue={savedEmail}
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
              {turnstileEnabled && (
                <p className="rounded-lg border border-navy-100 bg-navy-50/80 px-3 py-2 text-xs text-navy-600 dark:border-navy-700 dark:bg-navy-800/50 dark:text-navy-300">
                  Regular admins sign in with email and password after the security check. Only the owner account is
                  asked for an authenticator code.
                </p>
              )}
            </>
          )}

          {step === "security" && (
            <div className="space-y-4">
              <p className="text-sm text-navy-600 dark:text-navy-300">
                {turnstileEnabled
                  ? "Complete the security box below. Regular admins go straight to the dashboard; owners are asked for an authenticator code next."
                  : "Paste the verification token below to continue."}
              </p>
              {turnstileEnabled ? (
                <div className="overflow-hidden rounded-lg border border-navy-100 bg-white p-3 dark:border-navy-700 dark:bg-navy-950/40">
                  <TurnstileWidget
                    onToken={handleCaptchaToken}
                    theme="auto"
                    resetKey={turnstileResetKey}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-navy-600 dark:text-navy-400">
                    Verification token
                  </label>
                  <input name="captchaToken" type="text" className="input-base" placeholder="Paste captcha token" />
                </div>
              )}
              {loading && turnstileEnabled && (
                <p className="text-sm text-navy-500">Signing in…</p>
              )}
              <button
                type="button"
                onClick={goBackToForm}
                className="inline-flex items-center gap-1.5 text-xs text-navy-500 hover:text-teal-700 dark:hover:text-teal-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to email and password
              </button>
            </div>
          )}

          {step === "owner_totp" && (
            <div className="space-y-4">
              <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100">
                Owner sign-in: enter the <strong>current</strong> 6-digit code from Google Authenticator (changes every
                30 seconds).
              </p>
              <p className="text-xs text-navy-500">Signing in as {savedEmail}</p>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">
                  Authenticator code (owner only)
                </label>
                <input
                  ref={totpRef}
                  name="totpToken"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="123456"
                  className="input-base text-center text-lg tracking-widest"
                  autoComplete="one-time-code"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep("security");
                  setCaptchaToken("");
                  lastCaptchaLoginRef.current = null;
                  setTurnstileResetKey((k) => k + 1);
                  setError("");
                  setNotice("Complete the security check again.");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-navy-500 hover:text-teal-700 dark:hover:text-teal-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Redo security check
              </button>
            </div>
          )}

          {idleLogout && !error && step === "form" && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              You were signed out after 28 minutes of inactivity. Please sign in again.
            </p>
          )}
          {sessionExpired && !error && step === "form" && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your session expired. Please sign in again to continue.
            </p>
          )}
          {notice && !error && (
            <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
              {notice}
            </p>
          )}
          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {(step === "form" || step === "owner_totp" || (step === "security" && !turnstileEnabled)) && (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700 hover:shadow-md disabled:opacity-50"
            >
              {loading
                ? "Signing in…"
                : step === "owner_totp"
                  ? "Sign in"
                  : step === "security"
                    ? "Continue"
                    : turnstileEnabled
                      ? "Continue"
                      : "Sign in"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
