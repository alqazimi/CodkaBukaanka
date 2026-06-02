"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";

type Medication = { id: string; name: string; type?: string | null };

export function MedicationsManager({ medications }: { medications: Medication[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onDelete(id: string) {
    if (!token || !confirm("Delete this medication?")) return;
    setError("");
    try {
      const result = await clientApi.delete(`/api/admin/medications/${id}`, token);
      if (!result) {
        setError("Delete failed. Item may be linked to cases or backend is offline.");
        return;
      }
      refreshAdminPage(router);
    } catch {
      setError("Cannot delete medication that is linked to cases.");
    }
  }

  return (
    <div>
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <ul className="divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
        {medications.map((m) => (
          <li key={m.id} className="p-4">
            {editingId === m.id ? (
              <MedicationInlineForm
                medication={m}
                token={token}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null);
                  refreshAdminPage(router);
                }}
              />
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className="font-medium text-navy-900">{m.name}</span>
                  <p className="text-sm text-navy-500">{m.type ?? ""}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setEditingId(m.id)} className="min-h-[44px] rounded-xl border border-navy-200 px-3.5 py-2 text-sm font-medium text-navy-700 hover:bg-navy-50">Edit</button>
                  <button type="button" onClick={() => onDelete(m.id)} className="min-h-[44px] rounded-xl border border-red-200 px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MedicationInlineForm({
  medication,
  token,
  onSaved,
  onCancel,
}: {
  medication: Medication;
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
        `/api/admin/medications/${medication.id}`,
        {
          name: form.get("name"),
          type: form.get("type") || undefined,
        },
        token
      );
      if (!updated) {
        setError("Failed to update medication. Check backend connection.");
        setLoading(false);
        return;
      }
      onSaved();
    } catch {
      setError("Failed to update medication");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input name="name" defaultValue={medication.name} className={inputClass} required />
      <input name="type" defaultValue={medication.type ?? ""} className={inputClass} />
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button disabled={loading} className="rounded-md bg-teal-600 px-3 py-1.5 text-sm text-white">{loading ? "Saving..." : "Save"}</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-navy-200 px-3 py-1.5 text-sm">Cancel</button>
      </div>
    </form>
  );
}
