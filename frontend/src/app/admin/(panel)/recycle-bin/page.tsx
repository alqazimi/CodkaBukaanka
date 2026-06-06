import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import { RecycleBinManager, type RecycleBinItem } from "@/components/admin/RecycleBinManager";

export default async function RecycleBinPage() {
  const session = await requireAdmin();
  const role = (session.user as { role?: string }).role ?? "admin";

  if (role !== "owner") {
    redirect("/admin");
  }

  const { data, error } = await adminServerGet<{ items: RecycleBinItem[]; total: number }>(
    "/api/admin/recycle-bin"
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Recycle bin"
        description="Deleted items are kept here. Only the owner can view, restore, or permanently delete them."
      />
      <div className="mt-6">
        {error ? <AdminApiErrorBanner message={error} /> : null}
        <RecycleBinManager initialItems={data?.items ?? []} />
      </div>
    </AdminPage>
  );
}
