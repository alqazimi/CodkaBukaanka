import { requireAdmin } from "@/lib/admin-auth";
import { InboxManager } from "@/components/admin/InboxManager";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminInboxPage() {
  await requireAdmin();

  return (
    <AdminPage>
      <AdminPageHeader title="Inbox" description="Contact and correction requests from the public." />
      <div className="mt-6">
        <InboxManager />
      </div>
    </AdminPage>
  );
}
