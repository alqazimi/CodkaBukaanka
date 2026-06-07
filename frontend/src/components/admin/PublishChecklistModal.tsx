"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { adminBtnPrimary, adminBtnSecondary } from "@/components/admin/admin-ui";

export function PublishChecklistModal({
  open,
  onCancel,
  onConfirm,
  checks,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  checks: { label: string; ok: boolean }[];
}) {
  const [confirmed, setConfirmed] = useState(false);

  if (!open) return null;

  const allOk = checks.every((c) => c.ok);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md p-6">
        <h2 className="font-serif text-xl font-bold text-white">Publish this case?</h2>
        <p className="mt-2 text-sm text-muted">
          This report will appear on the public website. Review the checklist below.
        </p>
        <ul className="mt-4 space-y-2">
          {checks.map((check) => (
            <li
              key={check.label}
              className={cn(
                "flex items-start gap-2 text-sm",
                check.ok ? "text-red-300" : "text-red-300"
              )}
            >
              <span aria-hidden>{check.ok ? "✓" : "○"}</span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
        <label className="mt-4 flex items-start gap-2 text-sm text-white/85">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1"
          />
          <span>I confirm this case is ready for public viewing.</span>
        </label>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setConfirmed(false);
              onCancel();
            }}
            className={adminBtnSecondary}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!confirmed || !allOk}
            onClick={() => {
              setConfirmed(false);
              onConfirm();
            }}
            className={`${adminBtnPrimary} disabled:opacity-50`}
          >
            Publish now
          </button>
        </div>
        {!allOk && (
          <p className="mt-3 text-xs text-red-300">
            Complete all checklist items before publishing.
          </p>
        )}
      </div>
    </div>
  );
}
