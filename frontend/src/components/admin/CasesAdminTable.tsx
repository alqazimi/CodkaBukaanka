import Link from "next/link";
import { CaseDeleteButton } from "@/components/admin/CaseDeleteButton";
import { AdminTableWrap } from "@/components/admin/admin-ui";

type CaseRow = {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  slug: string;
  hospital?: { name: string };
  patient?: { fullName: string };
};

export function CasesAdminTable({ cases }: { cases: CaseRow[] }) {
  if (!cases.length) {
    return (
      <p className="rounded-xl border border-dashed border-navy-200 bg-white px-4 py-8 text-center text-sm text-navy-500">
        No cases yet. Create your first case to get started.
      </p>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="space-y-3 md:hidden">
        {cases.map((c) => (
          <li key={c.id} className="rounded-xl border border-navy-100 bg-white p-4 shadow-sm">
            <p className="font-mono text-xs text-navy-500">{c.caseNumber}</p>
            <Link href={`/admin/cases/${c.id}`} className="mt-1 block font-medium text-teal-700 hover:underline">
              {c.title}
            </Link>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-navy-600">
              <div>
                <dt className="text-navy-400">Hospital</dt>
                <dd className="font-medium text-navy-800">{c.hospital?.name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-navy-400">Patient</dt>
                <dd className="font-medium text-navy-800">{c.patient?.fullName ?? "—"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-navy-400">Status</dt>
                <dd className="font-medium text-navy-800">{c.status}</dd>
              </div>
            </dl>
            <div className="mt-4 flex justify-end border-t border-navy-50 pt-3">
              <CaseDeleteButton caseId={c.id} caseTitle={c.title} />
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <AdminTableWrap className="hidden md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-navy-50 text-left text-xs uppercase tracking-wide text-navy-500">
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
            {cases.map((c) => (
              <tr key={c.id} className="hover:bg-navy-50/80">
                <td className="px-4 py-3 font-mono text-xs text-navy-500">{c.caseNumber}</td>
                <td className="max-w-[200px] px-4 py-3">
                  <Link href={`/admin/cases/${c.id}`} className="font-medium text-teal-700 hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-navy-600">{c.hospital?.name ?? "—"}</td>
                <td className="px-4 py-3 text-navy-600">{c.patient?.fullName ?? "—"}</td>
                <td className="px-4 py-3 text-navy-600">{c.status}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <CaseDeleteButton caseId={c.id} caseTitle={c.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTableWrap>
    </>
  );
}
