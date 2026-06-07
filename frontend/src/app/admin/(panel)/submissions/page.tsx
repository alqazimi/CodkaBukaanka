import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { SubmissionsManager, type SubmissionItem } from "@/components/admin/SubmissionsManager";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminSubmissionsPage() {
  const { data, error, code } = await adminServerGet<SubmissionItem[]>("/api/admin/case-submissions");
  redirectIfSessionExpired({ code, error });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Case submissions"
        description="Public case reports submitted from the Submit a Case page. Review before creating a verified case."
      />
      {error ? <AdminApiErrorBanner message={error} /> : null}
      <div className="mt-6">
        <SubmissionsManager initialSubmissions={data ?? []} />
      </div>
    </AdminPage>
  );
}
