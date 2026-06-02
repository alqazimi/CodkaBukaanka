"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";
import { clientApi } from "@/lib/api";

type MfaStatus = {
  email: string;
  enabled: boolean;
  setupInProgress: boolean;
  updatedAt: string;
};

export function MfaSecurityPanel() {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    if (!token) return;
    clientApi.get<MfaStatus>("/api/admin/security/mfa/status", token).then((data) => {
      if (data) setStatus(data);
    });
  }, [token]);

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
    if (!token) return;
    const data = await clientApi.get<MfaStatus>("/api/admin/security/mfa/status", token);
    if (data) setStatus(data);
  }

  async function startSetup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await clientApi.post<{ ok: boolean; secret: string; otpauthUrl: string }>(
      "/api/admin/security/mfa/setup",
      { currentPassword: form.get("currentPasswordForMfa") },
      token
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
    if (!token) return;
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await clientApi.post<{ ok: boolean }>(
      "/api/admin/security/mfa/verify",
      { token: form.get("mfaToken") },
      token
    );
    if (res?.ok) {
      setNotice("MFA enabled successfully.");
      setSecret("");
      setOtpauthUrl("");
      await refreshStatus();
    } else {
      setNotice("Verification failed. Enter a valid 6-digit code.");
    }
    setLoading(false);
  }

  async function disableMfa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await clientApi.post<{ ok: boolean }>(
      "/api/admin/security/mfa/disable",
      {
        currentPassword: form.get("currentPasswordDisableMfa"),
        token: form.get("disableMfaToken"),
      },
      token
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
      <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-navy-900">Authenticator app (TOTP)</h2>
        <p className="mt-1 text-sm text-navy-600">
          Secure your account with Google Authenticator, Authy, 1Password, or similar apps.
        </p>
        <div className="mt-4 rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-700">
          <p><span className="font-medium">Status:</span> {statusLabel}</p>
          {status?.updatedAt && (
            <p className="text-xs text-navy-500">Last updated: {new Date(status.updatedAt).toLocaleString()}</p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-navy-900">1) Start setup</h3>
        <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={startSetup}>
          <input
            name="currentPasswordForMfa"
            type="password"
            placeholder="Current password"
            className="rounded-lg border border-navy-200 px-3 py-2 text-sm"
            required
          />
          <button
            disabled={loading}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60 sm:col-span-2"
            type="submit"
          >
            Generate QR and secret
          </button>
        </form>

        {(secret || qrDataUrl) && (
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="mb-2 text-sm font-medium text-teal-900">Scan this QR code</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="MFA QR code" className="h-56 w-56 rounded-md border border-teal-200 bg-white p-2" />
              ) : (
                <p className="text-sm text-teal-800">QR rendering failed. Use secret manually.</p>
              )}
            </div>
            <div className="rounded-xl border border-navy-200 bg-navy-50 p-4">
              <p className="mb-2 text-sm font-medium text-navy-900">Manual key</p>
              <code className="block break-all rounded bg-white px-2 py-1 text-xs text-navy-800">{secret}</code>
              <button
                type="button"
                onClick={copySecret}
                className="mt-3 rounded-md border border-navy-200 bg-white px-2.5 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50"
              >
                Copy secret
              </button>
              <p className="mt-2 text-xs text-navy-500">Keep this secret private. Anyone with it can generate codes.</p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-navy-900">2) Verify and enable</h3>
        <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={verifySetup}>
          <input
            name="mfaToken"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            placeholder="6-digit code"
            className="rounded-lg border border-navy-200 px-3 py-2 text-sm"
            required
          />
          <button
            disabled={loading}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 sm:col-span-2"
            type="submit"
          >
            Verify code and enable MFA
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-red-800">Disable MFA (emergency only)</h3>
        <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={disableMfa}>
          <input
            name="currentPasswordDisableMfa"
            type="password"
            placeholder="Current password"
            className="rounded-lg border border-red-200 px-3 py-2 text-sm"
            required
          />
          <input
            name="disableMfaToken"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            placeholder="Current MFA code"
            className="rounded-lg border border-red-200 px-3 py-2 text-sm"
            required
          />
          <button
            disabled={loading}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            type="submit"
          >
            Disable MFA
          </button>
        </form>
      </section>

      {notice && <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">{notice}</p>}
    </div>
  );
}
