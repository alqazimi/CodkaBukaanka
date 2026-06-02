"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";

export function HospitalForm() {
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
    try {
      const created = await clientApi.post("/api/admin/hospitals", Object.fromEntries(form), token);
      if (!created) {
        setError("Failed to add hospital. Make sure backend server is running.");
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <input name="name" placeholder="Hospital name *" required className={inputClass} />
      <input name="location" placeholder="Location *" required className={inputClass} />
      <textarea name="description" placeholder="Description" rows={2} className={`${inputClass} sm:col-span-2`} />
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white sm:col-span-2">
        {loading ? "Adding..." : "Add Hospital"}
      </button>
    </form>
  );
}
