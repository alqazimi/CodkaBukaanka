"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
import { clientApi } from "@/lib/api";
import { navigateAdmin } from "@/lib/admin-router";
import { adminInputClass, adminBtnSecondary } from "@/components/admin/admin-ui";

type MfaStatus = {
  email: string;
  enabled: boolean;
  setupInProgress: boolean;
  updatedAt: string;
};

export function MfaSecurityPanel() {
  const { update: updateSession } = useSession();
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    clientApi.get<MfaStatus>("/api/admin/security/mfa/status").then(async (data) => {
      if (!data) return;
      setStatus(data);
      if (data.enabled) {
        await updateSession({ requiresMfaSetup: false });
        if (window.location.search.includes("setup=1")) {
          navigateAdmin("/admin");
        }
      }
    });
  }, [updateSession]);

  useEffect(() => {
    if (!otpauthUrl) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [otpauthUrl]);

  const statusLabel = useMemo(() => {
    if (!status) return "Loading...";
    if (status.enabled) return "Enabled";
    if (status.setupInProgress) return "Setup in progress";
    return "Not enabled";
  }, [status]);

  async function refreshStatus() {
    const data = await clientApi.get<MfaStatus>("/api/admin/security/mfa/status");
    if (data) setStatus(data);
  }

  async function startSetup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await clientApi.post<{ ok: boolean; secret: string; otpauthUrl: string }>(
      "/api/admin/security/mfa/setup",
      { currentPassword: form.get("currentPasswordForMfa") }
    );
    if (res?.ok) {
      setSecret(res.secret);
      setOtpauthUrl(res.otpauthUrl);
      setNotice("MFA secret generated. Scan the QR code, then verify with a 6-digit code.");
      await refreshStatus();
    } else {
      setNotice("Could not start MFA setup. Check your password.");
    }
    setLoading(false);
  }

  async function verifySetup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await clientApi.post<{ ok: boolean }>(
      "/api/admin/security/mfa/verify",
      { token: form.get("mfaToken") }
    );
    if (res?.ok) {
      setNotice("MFA enabled successfully. Opening the dashboard…");
      setSecret("");
      setOtpauthUrl("");
      await updateSession({ requiresMfaSetup: false });
      await refreshStatus();
      navigateAdmin("/admin");
    } else {
      setNotice("Verification failed. Enter a valid 6-digit code.");
    }
    setLoading(false);
  }

  async function disableMfa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await clientApi.post<{ ok: boolean }>(
      "/api/admin/security/mfa/disable",
      {
        currentPassword: form.get("currentPasswordDisableMfa"),
        token: form.get("disableMfaToken"),
      }
    );
    if (res?.ok) {
      setNotice("MFA disabled.");
      await refreshStatus();
    } else {
      setNotice("Disable failed. Check your password and code.");
    }
    setLoading(false);
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setNotice("Manual key copied to clipboard.");
    } catch {
      setNotice("Could not copy key automatically. Please copy it manually.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="admin-surface p-4 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-navy-900 dark:text-navy-100">Authenticator app (TOTP)</h2>
        <p className="mt-1 text-sm text-navy-600 dark:text-navy-400">
          Secure your account with Google Authenticator, Authy, 1Password, or similar apps.
        </p>
        <div className="mt-4 rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-700 dark:bg-navy-800/80 dark:text-navy-300">
          <p><span className="font-medium">Status:</span> {statusLabel}</p>
          {status?.updatedAt && (
            <p className="text-xs text-navy-500">Last updated: {new Date(status.updatedAt).toLocaleString()}</p>
          )}
        </div>
      </section>

      <section className="admin-surface p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-100">1) Start setup</h3>
        <form className="mt-4 grid gap-3" onSubmit={startSetup}>
          <input
            name="currentPasswordForMfa"
            type="password"
            placeholder="Current password"
            className={adminInputClass}
            required
            aria-label="Current password for MFA setup"
          />
          <button
            disabled={loading}
            className="min-h-[44px] w-full rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60 sm:w-auto"
            type="submit"
          >
            Generate QR and secret
          </button>
        </form>

        {(secret || qrDataUrl) && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-950/40">
              <p className="mb-2 text-sm font-medium text-teal-900 dark:text-teal-300">Scan this QR code</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="MFA QR code" className="mx-auto h-auto max-w-full rounded-md border border-teal-200 bg-white p-2 sm:mx-0 sm:h-56 sm:w-56" />
              ) : (
                <p className="text-sm text-teal-800">QR rendering failed. Use secret manually.</p>
              )}
            </div>
            <div className="rounded-xl border border-navy-200 bg-navy-50 p-4 dark:border-navy-700 dark:bg-navy-800/80">
              <p className="mb-2 text-sm font-medium text-navy-900 dark:text-navy-100">Manual key</p>
              <code className="block break-all rounded bg-white px-2 py-1 text-xs text-navy-800 dark:bg-navy-950 dark:text-navy-200">{secret}</code>
              <button type="button" onClick={copySecret} className={`mt-3 ${adminBtnSecondary}`}>
                Copy secret
              </button>
              <p className="mt-2 text-xs text-navy-500">Keep this secret private. Anyone with it can generate codes.</p>
            </div>
          </div>
        )}
      </section>

      <section className="admin-surface p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-100">2) Verify and enable</h3>
        <form className="mt-4 grid gap-3" onSubmit={verifySetup}>
          <input
            name="mfaToken"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            placeholder="6-digit code"
            className={adminInputClass}
            required
            aria-label="Six digit MFA verification code"
          />
          <button
            disabled={loading}
            className="min-h-[44px] w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
            type="submit"
          >
            Verify code and enable MFA
          </button>
        </form>
      </section>

      <section className="admin-surface p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold text-navy-900 dark:text-navy-100">Session security</h3>
        <p className="mt-1 text-sm text-navy-600 dark:text-navy-400">
          Sign out all active sessions on every device if you suspect unauthorized access.
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            const res = await clientApi.post<{ ok: boolean }>("/api/admin/security/invalidate-sessions", {});
            setNotice(res?.ok ? "All sessions signed out. You may need to log in again on other devices." : "Could not invalidate sessions.");
            setLoading(false);
          }}
          className={`mt-4 ${adminBtnSecondary}`}
        >
          Sign out everywhere
        </button>
      </section>

      <section className="admin-surface border-red-100 p-4 shadow-sm dark:border-red-900/40 sm:p-6">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">Disable MFA (emergency only)</h3>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
          MFA cannot be disabled in production. Use this only in local development.
        </p>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={disableMfa}>
          <input
            name="currentPasswordDisableMfa"
            type="password"
            placeholder="Current password"
            className="min-h-[44px] w-full rounded-xl border border-red-200 px-3.5 py-2.5 text-base sm:text-sm"
            required
            aria-label="Current password to disable MFA"
          />
          <input
            name="disableMfaToken"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            placeholder="Current MFA code"
            className="min-h-[44px] w-full rounded-xl border border-red-200 px-3.5 py-2.5 text-base sm:text-sm"
            required
            aria-label="Current MFA code to disable MFA"
          />
          <button
            disabled={loading}
            className="min-h-[44px] w-full rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 sm:col-span-2"
            type="submit"
          >
            Disable MFA
          </button>
        </form>
      </section>

      {notice && <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700 dark:bg-navy-800/80 dark:text-navy-300">{notice}</p>}
    </div>
  );
}
