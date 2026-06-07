import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { InboxManager } from "@/components/admin/InboxManager";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

type MessageItem = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status?: "NEW" | "READ" | "ARCHIVED";
};

export default async function AdminInboxPage() {
  const { data, error, code } = await adminServerGet<MessageItem[]>("/api/admin/inbox");
  redirectIfSessionExpired({ code, error });

  return (
    <AdminPage>
      <AdminPageHeader title="Inbox" description="Contact and correction requests from the public." />
      {error ? <AdminApiErrorBanner message={error} /> : null}
      <div className="mt-6">
        <InboxManager initialMessages={data ?? []} />
      </div>
    </AdminPage>
  );
}
