"use client";

import { TurnstileWidget } from "@/components/admin/TurnstileWidget";

export function PublicTurnstileField({
  title,
  help,
  loadErrorText,
  onToken,
  resetKey,
}: {
  title: string;
  help: string;
  loadErrorText: string;
  onToken: (token: string) => void;
  resetKey: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="mb-2 text-sm font-semibold text-white/85">{title}</p>
      <p className="mb-3 text-xs leading-relaxed text-white/60">{help}</p>
      <TurnstileWidget
        onToken={onToken}
        theme="dark"
        resetKey={resetKey}
        loadErrorText={loadErrorText}
        errorClassName="mt-2 text-sm font-medium text-red-300"
      />
    </div>
  );
}
