"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";

type Patient = { id: string; fullName: string; age?: number | null; gender?: string | null };

export function PatientsManager({ patients }: { patients: Patient[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onDelete(id: string) {
    if (!token || !confirm("Delete this patient?")) return;
    setError("");
    try {
      const result = await clientApi.delete(`/api/admin/patients/${id}`, token);
      if (!result) {
        setError("Delete failed. Item may be linked to cases or backend is offline.");
        return;
      }
      router.refresh();
    } catch {
      setError("Cannot delete patient that is linked to cases.");
    }
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <ul className="divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
        {patients.map((p) => (
          <li key={p.id} className="p-4">
            {editingId === p.id ? (
              <PatientInlineForm
                patient={p}
                token={token}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="font-medium text-navy-900">{p.fullName}</span>
                  <p className="text-sm text-navy-500">{[p.age && `Age ${p.age}`, p.gender].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingId(p.id)} className="rounded-md border border-navy-200 px-3 py-1.5 text-sm">Edit</button>
                  <button type="button" onClick={() => onDelete(p.id)} className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-700">Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PatientInlineForm({
  patient,
  token,
  onSaved,
  onCancel,
}: {
  patient: Patient;
  token?: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputClass = "w-full rounded-lg border border-navy-200 px-3 py-2 text-sm";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const updated = await clientApi.patch(
        `/api/admin/patients/${patient.id}`,
        {
          fullName: form.get("fullName"),
          age: form.get("age") || undefined,
          gender: form.get("gender") || undefined,
        },
        token
      );
      if (!updated) {
        setError("Failed to update patient. Check backend connection.");
        setLoading(false);
        return;
      }
      onSaved();
    } catch {
      setError("Failed to update patient");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-3">
      <input name="fullName" defaultValue={patient.fullName} className={`${inputClass} sm:col-span-2`} required />
      <input name="age" type="number" defaultValue={patient.age ?? ""} className={inputClass} />
      <input name="gender" defaultValue={patient.gender ?? ""} className={`${inputClass} sm:col-span-2`} />
      {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
      <div className="sm:col-span-3 flex gap-2">
        <button disabled={loading} className="rounded-md bg-teal-600 px-3 py-1.5 text-sm text-white">{loading ? "Saving..." : "Save"}</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-navy-200 px-3 py-1.5 text-sm">Cancel</button>
      </div>
    </form>
  );
}
