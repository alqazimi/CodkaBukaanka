"use client";

import { useState } from "react";
import { clientApi } from "@/lib/api";
import { useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnPrimary, adminBtnSecondary, adminInputClass } from "@/components/admin/admin-ui";

type Option = { id: string; name?: string; fullName?: string };

export function QuickAddEntityModal({
  kind,
  open,
  onClose,
  onCreated,
}: {
  kind: "hospital" | "patient";
  open: boolean;
  onClose: () => void;
  onCreated: (item: Option) => void;
}) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    if (kind === "hospital") {
      const res = await clientApi.post<{ id: string; name: string }>("/api/admin/hospitals", {
        name: form.get("name"),
        location: form.get("location"),
        description: form.get("description") || "",
      });
      if (res?.id) {
        toast.success("Hospital added");
        onCreated({ id: res.id, name: res.name });
        onClose();
      } else {
        toast.error("Could not add hospital");
      }
    } else {
      const ageRaw = String(form.get("age") ?? "").trim();
      const res = await clientApi.post<{ id: string; fullName: string }>("/api/admin/patients", {
        fullName: form.get("fullName"),
        age: ageRaw ? Number(ageRaw) : undefined,
        gender: form.get("gender") || undefined,
      });
      if (res?.id) {
        toast.success("Patient added");
        onCreated({ id: res.id, fullName: res.fullName });
        onClose();
      } else {
        toast.error("Could not add patient");
      }
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6">
        <h2 className="font-serif text-lg font-bold text-white">
          Add {kind === "hospital" ? "hospital" : "patient"}
        </h2>
        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {kind === "hospital" ? (
            <>
              <input name="name" required placeholder="Hospital name *" className={adminInputClass} />
              <input name="location" required placeholder="City / location *" className={adminInputClass} />
              <textarea name="description" rows={2} placeholder="Description (optional)" className={adminInputClass} />
            </>
          ) : (
            <>
              <input name="fullName" required placeholder="Patient full name *" className={adminInputClass} />
              <input name="age" type="number" min={0} max={150} placeholder="Age (optional)" className={adminInputClass} />
              <input name="gender" placeholder="Gender (optional)" className={adminInputClass} />
            </>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className={`${adminBtnSecondary} min-h-[44px] flex-1`}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${adminBtnPrimary} min-h-[44px] flex-1`}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
