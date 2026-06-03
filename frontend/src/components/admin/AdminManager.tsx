"use client";

import { useState } from "react";
import { clientApi } from "@/lib/api";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminInputClass } from "@/components/admin/admin-ui";

type AdminRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  active?: boolean;
  createdAt: string;
  lockedUntil?: string | null;
  totpEnabled?: boolean;
  failedLoginAttempts?: number;
};

export function AdminManager({
  admins: initialAdmins,
  currentAdminId,
  canCreateAdmins,
  isOwner,
}: {
  admins: AdminRow[];
  currentAdminId: string;
  canCreateAdmins: boolean;
  isOwner: boolean;
}) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState(initialAdmins);

  async function handleCreateAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setLoading(true);
    const res = await clientApi.post<AdminRow>("/api/admin/admins", {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    });
    if (res?.id) {
      setAdmins((prev) => [...prev, res]);
      toast.success("Admin account created");
      formEl.reset();
    } else {
      toast.error("Could not create admin");
    }
    setLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setLoading(true);
    const res = await clientApi.patch<{ ok: boolean }>(`/api/admin/admins/${currentAdminId}/password`, {
      currentPassword: form.get("currentPassword"),
      newPassword: form.get("newPassword"),
    });
    if (res?.ok) {
      toast.success("Password updated");
      formEl.reset();
    } else {
      toast.error("Password update failed");
    }
    setLoading(false);
  }

  async function unlockAdmin(id: string) {
    const res = await clientApi.post<{ ok: boolean }>(`/api/admin/admins/${id}/unlock`, {});
    if (res?.ok) {
      setAdmins((prev) =>
        prev.map((a) => (a.id === id ? { ...a, lockedUntil: null, failedLoginAttempts: 0 } : a))
      );
      toast.success("Account unlocked");
    } else {
      toast.error("Could not unlock account");
    }
  }

  async function toggleActive(admin: AdminRow) {
    const res = await clientApi.patch<AdminRow>(`/api/admin/admins/${admin.id}`, { active: !admin.active });
    if (res?.id) {
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, ...res } : a)));
      toast.success(res.active ? "Account activated" : "Account deactivated");
    } else {
      toast.error("Could not update account");
    }
  }

  async function invalidateSessions(id: string) {
    const res = await clientApi.post<{ ok: boolean }>(`/api/admin/admins/${id}/invalidate-sessions`, {});
    if (res?.ok) toast.success("All sessions invalidated");
    else toast.error("Could not invalidate sessions");
  }

  return (
    <div className="space-y-8">
      <section className="admin-surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-navy-900 dark:text-navy-100">Change your password</h2>
        <form className="mt-4 grid gap-3" onSubmit={handleChangePassword}>
          <input name="currentPassword" type="password" placeholder="Current password" className={adminInputClass} />
          <input name="newPassword" type="password" placeholder="New password (min 8)" className={adminInputClass} required />
          <button
            disabled={loading}
            className="min-h-[44px] w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
            type="submit"
          >
            Update password
          </button>
        </form>
      </section>

      {canCreateAdmins && (
        <section className="admin-surface p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-navy-900 dark:text-navy-100">Add admin account</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleCreateAdmin}>
            <input name="name" placeholder="Name" className={adminInputClass} required />
            <input name="email" type="email" placeholder="Email" className={adminInputClass} required />
            <input
              name="password"
              type="password"
              placeholder="Temporary password"
              className={`${adminInputClass} sm:col-span-2`}
              required
            />
            <button
              disabled={loading}
              className="min-h-[44px] w-full rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60 sm:col-span-2"
              type="submit"
            >
              Create admin
            </button>
          </form>
        </section>
      )}

      <section className="admin-surface p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-navy-900 dark:text-navy-100">Admin accounts</h2>
        <ul className="mt-4 divide-y divide-navy-100 dark:divide-navy-800">
          {admins.map((a) => (
            <li key={a.id} className="py-4 text-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-navy-900 dark:text-navy-100">
                    {a.name} {a.id === currentAdminId && <span className="text-xs text-teal-700">(you)</span>}
                  </p>
                  <p className="text-navy-600 dark:text-navy-400">
                    {a.email} · {a.role}
                    {a.active === false && " · deactivated"}
                  </p>
                  <p className="mt-1 text-xs text-navy-500">
                    MFA: {a.totpEnabled ? "on" : "off"}
                    {a.lockedUntil && new Date(a.lockedUntil) > new Date() ? " · locked" : ""}
                  </p>
                </div>
                {isOwner && a.id !== currentAdminId && (
                  <div className="flex flex-wrap gap-2">
                    {a.lockedUntil && new Date(a.lockedUntil) > new Date() && (
                      <button type="button" onClick={() => unlockAdmin(a.id)} className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs">
                        Unlock
                      </button>
                    )}
                    <button type="button" onClick={() => toggleActive(a)} className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs">
                      {a.active === false ? "Activate" : "Deactivate"}
                    </button>
                    <button type="button" onClick={() => invalidateSessions(a.id)} className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs">
                      Sign out everywhere
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
