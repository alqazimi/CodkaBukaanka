import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { InboxManager } from "@/components/admin/InboxManager";

type InboxItem = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

export default async function AdminInboxPage() {
  await requireAdmin();
  const token = await getAccessToken();
  const messages = await serverApi.get<InboxItem[]>("/api/admin/inbox", {
    cache: "no-store",
    token: token ?? undefined,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-navy-900">Inbox</h1>
      <p className="text-sm text-navy-600">Contact and correction requests from the public.</p>
      <div className="mt-6">
        <InboxManager initialMessages={messages ?? []} />
      </div>
    </div>
  );
}
