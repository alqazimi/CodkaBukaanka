"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { clientApi } from "@/lib/api";

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
  const [messages, setMessages] = useState(initialMessages);
  const [type, setType] = useState<"all" | "contact" | "correction">("all");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    if (type === "all") return messages;
    return messages.filter((m) =>
      type === "correction" ? m.subject.startsWith("Correction") : !m.subject.startsWith("Correction")
    );
  }, [messages, type]);

  async function removeMessage(id: string) {
    if (!token) return;
    setLoading(true);
    const res = await clientApi.delete<{ ok: boolean }>(`/api/admin/inbox/${id}`, token);
    if (res?.ok) setMessages((prev) => prev.filter((m) => m.id !== id));
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(["all", "contact", "correction"] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm ${type === t ? "border-teal-600 bg-teal-50 text-teal-700" : "border-navy-200 text-navy-600"}`}
            onClick={() => setType(t)}
          >
            {t === "all" ? "All" : t === "contact" ? "Contact" : "Corrections"}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {filtered.map((m) => (
          <li key={m.id} className="rounded-xl border border-navy-100 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
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
                disabled={loading}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
                onClick={() => removeMessage(m.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
