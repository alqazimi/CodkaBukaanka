"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";
import { refreshAdminPage } from "@/lib/admin-router";

export function PatientForm() {
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
    const created = await clientApi.post("/api/admin/patients", {
      fullName: form.get("fullName"),
      age: form.get("age") || undefined,
      gender: form.get("gender") || undefined,
    }, token);
    if (!created) {
      setError("Failed to add patient. Make sure backend server is running.");
      setLoading(false);
      return;
    }
    refreshAdminPage(router);
    e.currentTarget.reset();
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-navy-100 bg-white p-4">
      <h3 className="font-semibold text-navy-900">Add patient</h3>
      <input name="fullName" required placeholder="Full name *" className={inputClass} />
      <div className="grid grid-cols-2 gap-3">
        <input name="age" type="number" placeholder="Age" className={inputClass} />
        <input name="gender" placeholder="Gender" className={inputClass} />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700 disabled:opacity-50">
        {loading ? "Saving..." : "Add patient"}
      </button>
    </form>
  );
}
