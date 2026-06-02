"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";

type AdminRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

export function AdminManager({
  admins,
  currentAdminId,
  canCreateAdmins,
}: {
  admins: AdminRow[];
  currentAdminId: string;
  canCreateAdmins: boolean;
}) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await clientApi.post<{ id: string }>(
      "/api/admin/admins",
      {
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
      },
      token
    );
    setNotice(res?.id ? "Admin created. Refresh to see updates." : "Failed to create admin.");
    setLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = new FormData(e.currentTarget);
    setLoading(true);
    const res = await clientApi.patch<{ ok: boolean }>(
      `/api/admin/admins/${currentAdminId}/password`,
      {
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      },
      token
    );
    setNotice(res?.ok ? "Password updated." : "Password update failed.");
    setLoading(false);
    if (res?.ok) e.currentTarget.reset();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-navy-100 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-navy-900">Change your password</h2>
        <form className="mt-4 grid gap-3" onSubmit={handleChangePassword}>
          <input name="currentPassword" type="password" placeholder="Current password" className="min-h-[44px] w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-base sm:text-sm" />
          <input name="newPassword" type="password" placeholder="New password (min 8)" className="min-h-[44px] w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-base sm:text-sm" required />
          <button disabled={loading} className="min-h-[44px] w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 sm:w-auto" type="submit">
            Update password
          </button>
        </form>
      </section>

      {canCreateAdmins && (
        <section className="rounded-xl border border-navy-100 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-navy-900">Add admin account</h2>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={handleCreateAdmin}>
            <input name="name" placeholder="Name" className="min-h-[44px] w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-base sm:text-sm" required />
            <input name="email" type="email" placeholder="Email" className="min-h-[44px] w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-base sm:text-sm" required />
            <input name="password" type="password" placeholder="Temporary password" className="min-h-[44px] w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-base sm:text-sm sm:col-span-2" required />
            <select name="role" defaultValue="admin" className="min-h-[44px] w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-base sm:text-sm sm:col-span-2">
              <option value="admin">admin</option>
              <option value="owner">owner</option>
            </select>
            <button disabled={loading} className="min-h-[44px] w-full rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-60 sm:col-span-2" type="submit">
              Create admin
            </button>
          </form>
        </section>
      )}

      <section className="rounded-xl border border-navy-100 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-navy-900">Admin accounts</h2>
        <ul className="mt-4 divide-y divide-navy-100">
          {admins.map((a) => (
            <li key={a.id} className="py-3 text-sm">
              <p className="font-medium text-navy-900">
                {a.name} {a.id === currentAdminId && <span className="text-xs text-teal-700">(you)</span>}
              </p>
              <p className="text-navy-600">{a.email} · {a.role}</p>
            </li>
          ))}
        </ul>
      </section>

      {notice && <p className="rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">{notice}</p>}
    </div>
  );
}
