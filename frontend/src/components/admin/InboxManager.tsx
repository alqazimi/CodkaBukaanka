"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger } from "@/components/admin/admin-ui";

type MessageItem = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  suspicious?: boolean;
};

const inboxDateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function InboxManager({ initialMessages }: { initialMessages: MessageItem[] }) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [messages, setMessages] = useState(initialMessages);
  const [type, setType] = useState<"all" | "contact" | "correction">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (type === "all") return messages;
    return messages.filter((m) =>
      type === "correction" ? m.subject.startsWith("Correction") : !m.subject.startsWith("Correction")
    );
  }, [messages, type]);

  async function removeMessage(message: MessageItem) {
    if (!token) return;
    const ok = await confirm({
      title: "Delete message?",
      description: `Remove "${message.subject}" from ${message.name}? This cannot be undone.`,
      confirmLabel: "Delete message",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(message.id);
    const res = await clientApi.delete<{ ok: boolean }>(`/api/admin/inbox/${message.id}`, token);
    if (res?.ok) {
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      toast.success("Message deleted");
    } else {
      toast.error("Could not delete message", getLastApiError() ?? "Please try again.");
    }
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["all", "contact", "correction"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-sm font-medium ${type === t ? "border-teal-600 bg-teal-50 text-teal-700" : "border-navy-200 text-navy-600"}`}
            onClick={() => setType(t)}
          >
            {t === "all" ? "All" : t === "contact" ? "Contact" : "Corrections"}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {filtered.map((m) => (
          <li key={m.id} className="admin-surface p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-navy-900">
                  {m.subject}
                  {m.suspicious && (
                    <span className="ml-2 rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                      Suspicious prompt-like text
                    </span>
                  )}
                </p>
                <p className="text-sm text-navy-600">
                  {m.name} ({m.email})
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-navy-700">{m.message}</p>
                <p className="mt-2 text-xs text-navy-400">{inboxDateFormatter.format(new Date(m.createdAt))} UTC</p>
              </div>
              <button
                type="button"
                disabled={deletingId === m.id}
                className={adminBtnDanger}
                onClick={() => removeMessage(m)}
              >
                {deletingId === m.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
