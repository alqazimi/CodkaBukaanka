"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";

export function MedicationForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputClass = "w-full rounded-lg border border-navy-200 px-3 py-2 text-sm";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) {
      setError("Your session expired. Please sign in again.");
      return;
    }
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const created = await clientApi.post("/api/admin/medications", {
      name: form.get("name"),
      type: form.get("type") || undefined,
    }, token);
    if (!created) {
      setError("Failed to add medication. Make sure backend server is running.");
      setLoading(false);
      return;
    }
    router.refresh();
    e.currentTarget.reset();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-100 bg-white p-4">
      <h3 className="font-semibold text-navy-900">Add medication</h3>
      <input name="name" required placeholder="Medication name *" className={inputClass} />
      <input name="type" placeholder="Type (e.g. Antidiabetic)" className={inputClass} />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700 disabled:opacity-50">
        {loading ? "Saving..." : "Add medication"}
      </button>
    </form>
  );
}
