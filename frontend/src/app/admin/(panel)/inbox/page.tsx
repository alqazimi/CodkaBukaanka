import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { InboxManager } from "@/components/admin/InboxManager";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

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
    <AdminPage>
      <AdminPageHeader title="Inbox" description="Contact and correction requests from the public." />
      <div className="mt-6">
        <InboxManager initialMessages={messages ?? []} />
      </div>
    </AdminPage>
  );
}
