import { redirectIfMfaSetupRequired, requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { InboxManager } from "@/components/admin/InboxManager";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";

type InboxItem = {
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

export default async function AdminInboxPage() {
  await requireAdmin();
  const { data: messages, error, code } = await adminServerGet<InboxItem[]>("/api/admin/inbox");
  redirectIfMfaSetupRequired({ code, error });

  return (
    <AdminPage>
      <AdminPageHeader title="Inbox" description="Contact and correction requests from the public." />
      <div className="mt-6">
        {error ? <AdminApiErrorBanner message={error} /> : null}
        <InboxManager initialMessages={messages ?? []} />
      </div>
    </AdminPage>
  );
}
