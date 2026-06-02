"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi, getLastApiError } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger, adminBtnPrimary, adminBtnSecondary } from "@/components/admin/admin-ui";

type Doctor = { id: string; fullName: string; specialty?: string | null; hospitalId?: string | null; hospital?: { name: string } | null };
type HospitalOption = { id: string; name: string };

export function DoctorsManager({ doctors, hospitals }: { doctors: Doctor[]; hospitals: HospitalOption[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(doctor: Doctor) {
    if (!token) return;
    const ok = await confirm({
      title: "Delete doctor?",
      description: `Dr. ${doctor.fullName} will be permanently removed. Doctors linked to cases cannot be deleted.`,
      confirmLabel: "Delete doctor",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(doctor.id);
    try {
      const result = await clientApi.delete(`/api/admin/doctors/${doctor.id}`, token);
      if (!result) {
        toast.error("Could not delete doctor", getLastApiError() ?? "It may still be linked to cases.");
        return;
      }
      toast.success("Doctor deleted", doctor.fullName);
      refreshAdminPage(router);
    } catch {
      toast.error("Could not delete doctor", "It may still be linked to cases.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ul className="divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
      {doctors.map((d) => (
        <li key={d.id} className="p-4">
          {editingId === d.id ? (
            <DoctorInlineForm
              doctor={d}
              hospitals={hospitals}
              token={token}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                toast.success("Doctor updated", d.fullName);
                refreshAdminPage(router);
              }}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="font-medium text-navy-900">{d.fullName}</span>
                <p className="text-sm text-navy-500">{d.specialty ?? d.hospital?.name ?? ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditingId(d.id)} className={adminBtnSecondary}>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(d)}
                  disabled={deletingId === d.id}
                  className={adminBtnDanger}
                >
                  {deletingId === d.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function DoctorInlineForm({
  doctor,
  hospitals,
  token,
  onSaved,
  onCancel,
}: {
  doctor: Doctor;
  hospitals: HospitalOption[];
  token?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);
  const inputClass = "w-full min-h-[44px] rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const updated = await clientApi.patch(
        `/api/admin/doctors/${doctor.id}`,
        {
          fullName: form.get("fullName"),
          specialty: form.get("specialty") || undefined,
          hospitalId: form.get("hospitalId") || null,
        },
        token
      );
      if (!updated) {
        toast.error("Update failed", getLastApiError() ?? "Please try again.");
        setLoading(false);
        return;
      }
      onSaved();
    } catch {
      toast.error("Update failed", getLastApiError() ?? "Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
      <input name="fullName" defaultValue={doctor.fullName} className={`${inputClass} sm:col-span-2`} required />
      <input name="specialty" defaultValue={doctor.specialty ?? ""} className={inputClass} />
      <select name="hospitalId" defaultValue={doctor.hospitalId ?? ""} className={`${inputClass} sm:col-span-2`}>
        <option value="">Hospital (optional)</option>
        {hospitals.map((h) => (
          <option key={h.id} value={h.id}>{h.name}</option>
        ))}
      </select>
      <div className="flex gap-2 sm:col-span-3">
        <button type="submit" disabled={loading} className={adminBtnPrimary}>
          {loading ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className={adminBtnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
