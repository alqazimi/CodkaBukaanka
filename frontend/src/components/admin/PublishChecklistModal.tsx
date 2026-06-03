"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-navy-200 bg-white p-6 shadow-xl dark:border-navy-700 dark:bg-navy-900">
        <h2 className="font-serif text-xl font-semibold text-navy-900 dark:text-navy-50">Publish this case?</h2>
        <p className="mt-2 text-sm text-navy-600 dark:text-navy-400">
          This report will appear on the public website. Review the checklist below.
        </p>
        <ul className="mt-4 space-y-2">
          {checks.map((check) => (
            <li
              key={check.label}
              className={cn(
                "flex items-start gap-2 text-sm",
                check.ok ? "text-teal-700 dark:text-teal-300" : "text-amber-700 dark:text-amber-300"
              )}
            >
              <span aria-hidden>{check.ok ? "✓" : "○"}</span>
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
        <label className="mt-4 flex items-start gap-2 text-sm text-navy-700 dark:text-navy-300">
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
            className="min-h-[44px] rounded-xl border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 dark:border-navy-600 dark:text-navy-200"
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
            className="min-h-[44px] rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Publish now
          </button>
        </div>
        {!allOk && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
            Complete all checklist items before publishing.
          </p>
        )}
      </div>
    </div>
  );
}
