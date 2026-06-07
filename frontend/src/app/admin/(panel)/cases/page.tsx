import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { CasesAdminPanel } from "@/components/admin/CasesAdminPanel";
import { AdminPage, AdminPageHeader, adminBtnPrimary } from "@/components/admin/admin-ui";
import type { PaginatedResponse } from "@/lib/api";
import Link from "next/link";
import { Plus } from "lucide-react";

type CaseRow = {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  slug: string;
  riskLevel?: string;
  hospital?: { name: string; location?: string };
  patient?: { fullName: string };
  publicEvidenceCount?: number;
  _count?: { evidence: number };
};

export default async function AdminCasesPage() {
  const { data, error, code } = await adminServerGet<PaginatedResponse<CaseRow>>(
    "/api/admin/cases?page=1&limit=25"
  );
  redirectIfSessionExpired({ code, error });
  const initialData = data
    ? { ...data, totalPages: Math.max(1, Math.ceil(data.total / data.limit)) }
    : null;

  return (
    <AdminPage>
      <AdminPageHeader
        title="Cases"
        description="Manage incident records, workflow status, and evidence."
        actions={
          <Link href="/admin/cases/new" className={adminBtnPrimary}>
            <Plus className="h-4 w-4" />
            New Case
          </Link>
        }
      />
      <div className="mt-6">
        <CasesAdminPanel initialData={initialData} initialError={error} serverPrefetched={Boolean(initialData)} />
      </div>
    </AdminPage>
  );
}
