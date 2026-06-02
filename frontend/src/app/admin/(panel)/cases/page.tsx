import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { CaseDeleteButton } from "@/components/admin/CaseDeleteButton";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function AdminCasesPage() {
  await requireAdmin();
  const token = await getAccessToken();

  const cases = await serverApi.get<
    { id: string; caseNumber: string; title: string; status: string; slug: string; hospital?: { name: string }; patient?: { fullName: string } }[]
  >("/api/admin/cases", { cache: "no-store", token: token ?? undefined });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Cases</h1>
        <Link href="/admin/cases/new" className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          <Plus className="h-4 w-4" />
          New Case
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-navy-100 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-navy-50 text-left text-xs uppercase text-navy-500">
            <tr>
              <th className="px-4 py-3">Case #</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Hospital</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {(cases ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-navy-50">
                <td className="px-4 py-3 font-mono text-xs text-navy-500">{c.caseNumber}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/cases/${c.id}`} className="font-medium text-teal-700 hover:underline">{c.title}</Link>
                </td>
                <td className="px-4 py-3 text-navy-600">{c.hospital?.name ?? "—"}</td>
                <td className="px-4 py-3 text-navy-600">{c.patient?.fullName ?? "—"}</td>
                <td className="px-4 py-3">{c.status}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <CaseDeleteButton caseId={c.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
