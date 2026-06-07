"use client";

import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { navigateAfterLogin } from "@/lib/admin-router";
import { getLoginErrorMessage, loginErrorNeedsCaptcha } from "@/lib/login-error-message";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AdminLocaleToggle } from "@/components/admin/AdminLocaleToggle";
import { hasTurnstileSiteKey, TurnstileWidget } from "@/components/admin/TurnstileWidget";
import { AlertCircle, ArrowLeft, Shield } from "lucide-react";

const turnstileEnabled = hasTurnstileSiteKey();

/** After captcha is required, collect security check then a fresh TOTP on its own step. */
type LoginStep = "form" | "security" | "authenticator";

export default function AdminLoginPage() {
  const totpRef = useRef<HTMLInputElement>(null);
  const [idleLogout, setIdleLogout] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [error, setError] = useState("");
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
    if (step === "authenticator") {
      totpRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (step === "security" && captchaToken) {
      setError("");
      setStep("authenticator");
    }
  }, [step, captchaToken]);

  function handleCaptchaToken(token: string) {
    setCaptchaToken(token);
  }

  async function attemptSignIn(
    email: string,
    password: string,
    totpToken: string,
    token: string
  ) {
    return signIn("credentials", {
      email,
      password,
      totpToken,
      captchaToken: token,
      redirect: false,
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);

    if (step === "authenticator") {
      const totpToken = String(form.get("totpToken") ?? "").trim();
      if (!/^\d{6}$/.test(totpToken)) {
        setLoading(false);
        setError("Enter the current 6-digit code from Google Authenticator.");
        return;
      }
      if (turnstileEnabled && !captchaToken) {
        setLoading(false);
        setStep("security");
        setError("Complete the security check, then enter your authenticator code.");
        return;
      }

      const result = await attemptSignIn(savedEmail, savedPassword, totpToken, captchaToken);
      if (result?.error) {
        setLoading(false);
        const msg = getLoginErrorMessage(result.error, result.code);
        if (loginErrorNeedsCaptcha(msg, result.code)) {
          setCaptchaToken("");
          setTurnstileResetKey((k) => k + 1);
          setStep("security");
          setError("Security check expired or failed. Complete it again, then enter a fresh authenticator code.");
          return;
        }
        if (result.code === "mfa_invalid") {
          setError("That code expired or was wrong. Open Google Authenticator and enter the new 6-digit code shown now.");
          totpRef.current?.focus();
          totpRef.current?.select();
          return;
        }
        setError(msg);
        if (result.code === "invalid_credentials") {
          setStep("form");
        }
        return;
      }
      navigateAfterLogin("/admin");
      return;
    }

    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const totpToken = String(form.get("totpToken") ?? "").trim();

    if (turnstileEnabled && !captchaToken) {
      setSavedEmail(email);
      setSavedPassword(password);
      setLoading(false);
      setStep("security");
      setError("Complete the security check first. You will enter your authenticator code on the next step.");
      return;
    }

    const result = await attemptSignIn(email, password, totpToken, captchaToken);
    if (result?.error) {
      setLoading(false);
      const msg = getLoginErrorMessage(result.error, result.code);
      if (loginErrorNeedsCaptcha(msg, result.code)) {
        setSavedEmail(email);
        setSavedPassword(password);
        setCaptchaToken("");
        setTurnstileResetKey((k) => k + 1);
        setStep("security");
        setError("Security check required. Complete the box below — you will enter a fresh authenticator code next.");
        return;
      }
      setError(msg);
      return;
    }
    navigateAfterLogin("/admin");
  }

  function goBackToForm() {
    setStep("form");
    setError("");
    setCaptchaToken("");
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
          {step === "form" && "CodkaBukaanka — Admin access only. MFA is required for secured accounts."}
          {step === "security" && "Step 1 of 2 — Security check"}
          {step === "authenticator" && "Step 2 of 2 — Authenticator code"}
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
              {!turnstileEnabled && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">
                    Authenticator code (TOTP)
                  </label>
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
                    Use the current 6-digit code from Google Authenticator for this email.
                  </p>
                </div>
              )}
              {turnstileEnabled && (
                <p className="rounded-lg border border-navy-100 bg-navy-50/80 px-3 py-2 text-xs text-navy-600 dark:border-navy-700 dark:bg-navy-800/50 dark:text-navy-300">
                  After email and password, you will complete a quick security check, then enter your authenticator
                  code on the next screen so it does not expire.
                </p>
              )}
            </>
          )}

          {step === "security" && (
            <div className="space-y-4">
              <p className="text-sm text-navy-600 dark:text-navy-300">
                Tick the security box below. When it shows verified, we will ask for your authenticator code on the next
                screen.
              </p>
              <div className="overflow-hidden rounded-lg border border-navy-100 bg-white p-3 dark:border-navy-700 dark:bg-navy-950/40">
                <TurnstileWidget
                  onToken={handleCaptchaToken}
                  theme="auto"
                  resetKey={turnstileResetKey}
                />
              </div>
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

          {step === "authenticator" && (
            <div className="space-y-4">
              <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-teal-100">
                Security check complete. Enter the <strong>current</strong> 6-digit code from Google Authenticator now —
                codes change every 30 seconds.
              </p>
              <p className="text-xs text-navy-500">Signing in as {savedEmail}</p>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">
                  Authenticator code (TOTP)
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
                  setTurnstileResetKey((k) => k + 1);
                  setError("");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-navy-500 hover:text-teal-700 dark:hover:text-teal-300"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Redo security check
              </button>
            </div>
          )}

          {captchaRequiredFallback()}

          {idleLogout && !error && step === "form" && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              You were signed out after 28 minutes of inactivity. Please sign in again.
            </p>
          )}
          {sessionExpired && !error && step === "form" && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Your session expired. Please sign in again to continue.
            </p>
          )}
          {error && (
            <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {(step === "form" || step === "authenticator") && (
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-teal-700 hover:shadow-md disabled:opacity-50"
            >
              {loading ? "Signing in…" : step === "authenticator" ? "Sign in" : turnstileEnabled ? "Continue" : "Sign in"}
            </button>
          )}
        </form>
      </div>
    </div>
  );

  function captchaRequiredFallback() {
    if (step !== "security" || turnstileEnabled) return null;
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
        <p className="text-xs text-amber-900 dark:text-amber-200">
          Extra verification is required but Turnstile is not configured. Add{" "}
          <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> on
          Vercel and <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/50">CAPTCHA_SECRET</code> on Railway,
          then redeploy.
        </p>
        <label className="mb-1.5 mt-3 block text-xs font-medium uppercase tracking-wide text-navy-600 dark:text-navy-400">
          Verification token (advanced)
        </label>
        <input name="captchaToken" type="text" className="input-base" placeholder="Paste captcha token" />
      </div>
    );
  }
}
