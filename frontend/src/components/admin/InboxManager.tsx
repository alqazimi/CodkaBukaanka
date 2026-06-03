"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { clientApi, getLastApiError } from "@/lib/api";
import { useAdminConfirm, useAdminToast } from "@/components/admin/AdminFeedbackProvider";
import { adminBtnDanger, adminBtnSecondary, adminInputClass } from "@/components/admin/admin-ui";

type MessageItem = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status?: "NEW" | "READ" | "ARCHIVED";
  internalNote?: string | null;
  linkedCaseId?: string | null;
  linkedCase?: { id: string; caseNumber: string; title: string; slug: string } | null;
  readBy?: { name: string } | null;
  suspicious?: boolean;
};

const inboxDateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

export function InboxManager({ initialMessages }: { initialMessages: MessageItem[] }) {
  const confirm = useAdminConfirm();
  const toast = useAdminToast();
  const [messages, setMessages] = useState(initialMessages);
  const [type, setType] = useState<"all" | "contact" | "correction">("all");
  const [status, setStatus] = useState<"all" | "new" | "read" | "archived">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      const typeOk =
        type === "all" ||
        (type === "correction" ? m.subject.startsWith("Correction") : !m.subject.startsWith("Correction"));
      const statusOk =
        status === "all" ||
        (status === "new" && (m.status ?? "NEW") === "NEW") ||
        (status === "read" && m.status === "READ") ||
        (status === "archived" && m.status === "ARCHIVED");
      return typeOk && statusOk;
    });
  }, [messages, type, status]);

  async function patchMessage(id: string, body: Record<string, unknown>) {
    const updated = await clientApi.patch<MessageItem>(`/api/admin/inbox/${id}`, body);
    if (updated) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      return true;
    }
    toast.error("Could not update message", getLastApiError() ?? "Please try again.");
    return false;
  }

  async function removeMessage(message: MessageItem) {
    const ok = await confirm({
      title: "Delete message?",
      description: `Remove "${message.subject}" from ${message.name}? This cannot be undone.`,
      confirmLabel: "Delete message",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingId(message.id);
    const res = await clientApi.delete<{ ok: boolean }>(`/api/admin/inbox/${message.id}`);
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
            className={`min-h-[40px] rounded-xl border px-3.5 py-2 text-sm font-medium ${
              type === t ? "border-teal-600 bg-teal-50 text-teal-700" : "border-navy-200 text-navy-600"
            }`}
            onClick={() => setType(t)}
          >
            {t === "all" ? "All types" : t === "contact" ? "Contact" : "Corrections"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "read", "archived"] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`min-h-[40px] rounded-xl border px-3.5 py-2 text-sm font-medium ${
              status === s ? "border-navy-800 bg-navy-900 text-white" : "border-navy-200 text-navy-600"
            }`}
            onClick={() => setStatus(s)}
          >
            {s === "all" ? "All status" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {filtered.map((m) => (
          <li key={m.id} className="admin-surface p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-navy-900 dark:text-navy-100">{m.subject}</p>
                    {(m.status ?? "NEW") === "NEW" && (
                      <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">New</span>
                    )}
                    {m.status === "ARCHIVED" && (
                      <span className="rounded bg-navy-100 px-2 py-0.5 text-xs text-navy-600">Archived</span>
                    )}
                    {m.suspicious && (
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Suspicious</span>
                    )}
                  </div>
                  <p className="text-sm text-navy-600 dark:text-navy-400">
                    {m.name} ({m.email})
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-navy-700 dark:text-navy-300">{m.message}</p>
                  <p className="mt-2 text-xs text-navy-400">
                    {inboxDateFormatter.format(new Date(m.createdAt))} UTC
                    {m.readBy?.name ? ` · Read by ${m.readBy.name}` : ""}
                  </p>
                  {m.internalNote && (
                    <p className="mt-2 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-600 dark:bg-navy-800">
                      Note: {m.internalNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {m.linkedCaseId && (
                  <Link href={`/admin/cases/${m.linkedCaseId}`} className={adminBtnSecondary}>
                    Open linked case
                  </Link>
                )}
                {(m.status ?? "NEW") === "NEW" && (
                  <button type="button" className={adminBtnSecondary} onClick={() => patchMessage(m.id, { status: "READ" })}>
                    Mark read
                  </button>
                )}
                {m.status !== "ARCHIVED" && (
                  <button type="button" className={adminBtnSecondary} onClick={() => patchMessage(m.id, { status: "ARCHIVED" })}>
                    Archive
                  </button>
                )}
                <button
                  type="button"
                  disabled={deletingId === m.id}
                  className={adminBtnDanger}
                  onClick={() => removeMessage(m)}
                >
                  {deletingId === m.id ? "Deleting…" : "Delete"}
                </button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={noteDrafts[m.id] ?? m.internalNote ?? ""}
                  onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  placeholder="Internal note (not visible to sender)"
                  className={adminInputClass}
                />
                <button
                  type="button"
                  className="min-h-[44px] shrink-0 rounded-xl border border-navy-200 px-4 text-sm dark:border-navy-600"
                  onClick={() =>
                    patchMessage(m.id, { internalNote: noteDrafts[m.id] ?? m.internalNote ?? "" })
                  }
                >
                  Save note
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-navy-200 px-4 py-8 text-center text-sm text-navy-500">
          No messages in this view.
        </p>
      )}
    </div>
  );
}
