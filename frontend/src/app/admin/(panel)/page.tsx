import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { FileText, Building2, User, Stethoscope, Pill, Activity, AlertTriangle, Shield } from "lucide-react";
import Link from "next/link";
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, CATEGORY_LABELS } from "@/lib/constants";
import type { CaseCategory, RiskLevel } from "@/types/entities";

type Analytics = {
  totalCases: number;
  draftCases: number;
  publishedCases: number;
  totalHospitals: number;
  totalPatients: number;
  totalDoctors: number;
  totalMedications: number;
  casesByHospital: { hospital: { name: string; slug: string; location: string } | null | undefined; count: number }[];
  casesByCategory: { category: CaseCategory; _count: number }[];
  casesByRiskLevel: { riskLevel: RiskLevel; _count: number }[];
  trendingMedications: { medication: { name: string; slug: string } | null | undefined; count: number }[];
  riskAnalysis: {
    summary: {
      totalPublicCases: number;
      criticalCases: number;
      highRiskCases: number;
      highRiskHospitals: number;
    };
    hospitalClusters: {
      hospitalName: string;
      slug: string;
      location: string;
      caseCount: number;
      criticalCount: number;
      highCount: number;
      riskScore: number;
    }[];
    medicationPatterns: { name: string; slug: string; caseCount: number; highOrCriticalCount: number }[];
    criticalCases: {
      caseNumber: string;
      title: string;
      slug: string;
      riskLevel: RiskLevel;
      hospital: string;
    }[];
  };
  recentCases: { id: string; caseNumber: string; title: string; status: string; riskLevel?: RiskLevel; slug: string; hospital?: { name: string }; patient?: { fullName: string } }[];
  canViewGlobalAudit?: boolean;
  recentLogs: { id: string; action: string; entityType: string; createdAt: string; admin?: { name: string } }[];
};

export default async function AdminDashboardPage() {
  await requireAdmin();
  const token = await getAccessToken();

  const data = await serverApi.get<Analytics>("/api/admin/dashboard", {
    cache: "no-store",
    token: token ?? undefined,
  });

  const stats = [
    { label: "Total Cases", value: data?.totalCases ?? 0, icon: FileText, href: "/admin/cases" },
    { label: "Published / Verified", value: data?.publishedCases ?? 0, icon: Shield, href: "/admin/cases" },
    { label: "Draft / Review", value: data?.draftCases ?? 0, icon: FileText, href: "/admin/cases" },
    { label: "Critical + High", value: (data?.riskAnalysis?.summary.criticalCases ?? 0) + (data?.riskAnalysis?.summary.highRiskCases ?? 0), icon: AlertTriangle, href: "/admin/cases" },
    { label: "Hospitals", value: data?.totalHospitals ?? 0, icon: Building2, href: "/admin/hospitals" },
    { label: "Patients", value: data?.totalPatients ?? 0, icon: User, href: "/admin/patients" },
    { label: "Doctors", value: data?.totalDoctors ?? 0, icon: Stethoscope, href: "/admin/doctors" },
    { label: "Medications", value: data?.totalMedications ?? 0, icon: Pill, href: "/admin/medications" },
  ];

  return (
    <div className="p-6 sm:p-8">
      <div className="rounded-2xl border border-navy-200/70 bg-gradient-to-br from-white to-navy-50/40 p-6 shadow-soft">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-navy-900">Intelligence Dashboard</h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">Medical incident analytics — admin-only investigation platform</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card-interactive p-5">
            <s.icon className="h-8 w-8 text-teal-600" />
            <p className="mt-3 text-3xl font-semibold tracking-tight text-navy-900">{s.value}</p>
            <p className="text-sm text-navy-600">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="card-surface p-6">
          <h2 className="font-semibold text-navy-900">Cases by risk level</h2>
          <ul className="mt-4 space-y-2">
            {(data?.casesByRiskLevel ?? []).map((r) => (
              <li key={r.riskLevel} className="flex items-center justify-between text-sm">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK_LEVEL_COLORS[r.riskLevel]}`}>
                  {RISK_LEVEL_LABELS[r.riskLevel].en}
                </span>
                <span className="font-mono font-semibold text-navy-900">{r._count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-6">
          <h2 className="font-semibold text-navy-900">Cases by category</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(data?.casesByCategory ?? []).map((c) => (
              <li key={c.category} className="flex justify-between text-navy-700">
                <span>{CATEGORY_LABELS[c.category]?.en ?? c.category}</span>
                <span className="font-mono font-semibold">{c._count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            High-risk hospitals
          </h2>
          <ul className="mt-4 divide-y divide-navy-100">
            {(data?.riskAnalysis?.hospitalClusters ?? []).slice(0, 5).map((h) => (
              <li key={h.slug} className="py-3">
                <Link href={`/en/hospitals/${h.slug}`} className="hover:text-teal-700">
                  <p className="font-medium text-navy-900">{h.hospitalName}</p>
                  <p className="text-xs text-navy-500">
                    {h.caseCount} cases · {h.criticalCount} critical · {h.highCount} high · score {h.riskScore}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <Pill className="h-5 w-5 text-teal-600" />
            Trending medications
          </h2>
          <ul className="mt-4 divide-y divide-navy-100">
            {(data?.trendingMedications ?? []).slice(0, 5).map((m, i) => (
              <li key={i} className="flex justify-between py-3 text-sm">
                <Link href={m.medication ? `/en/medications/${m.medication.slug}` : "#"} className="font-medium text-navy-900 hover:text-teal-700">
                  {m.medication?.name ?? "Unknown"}
                </Link>
                <span className="text-navy-500">{m.count} cases</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="card-surface p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <Activity className="h-5 w-5 text-teal-600" />
            Critical & high-risk cases
          </h2>
          <ul className="mt-4 divide-y divide-navy-100">
            {(data?.riskAnalysis?.criticalCases ?? []).slice(0, 6).map((c) => (
              <li key={c.slug} className="py-3">
                <Link href={`/admin/cases`} className="hover:text-teal-700">
                  <p className="font-medium text-navy-900">{c.title}</p>
                  <p className="text-xs text-navy-500">
                    {c.caseNumber} · {c.hospital} ·{" "}
                    <span className={`rounded border px-1 ${RISK_LEVEL_COLORS[c.riskLevel]}`}>{c.riskLevel}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-6">
          <h2 className="font-semibold text-navy-900">Recent cases</h2>
          <ul className="mt-4 divide-y divide-navy-100">
            {(data?.recentCases ?? []).map((c) => (
              <li key={c.id} className="py-3">
                <Link href={`/admin/cases/${c.id}`} className="hover:text-teal-700">
                  <p className="font-medium text-navy-900">{c.title}</p>
                  <p className="text-xs text-navy-500">
                    {c.caseNumber} · {c.hospital?.name} · {c.patient?.fullName} · {c.status}
                    {c.riskLevel && ` · ${c.riskLevel}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10 card-surface p-6">
        <h2 className="font-semibold text-navy-900">
          {data?.canViewGlobalAudit ? "Audit log (all admins)" : "My audit log"}
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {(data?.recentLogs ?? []).map((log) => (
            <li key={log.id} className="flex justify-between text-navy-700">
              <span>
                {log.action} {log.entityType}
                {data?.canViewGlobalAudit && log.admin && ` by ${log.admin.name}`}
              </span>
              <time className="text-xs text-navy-400">{new Date(log.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
