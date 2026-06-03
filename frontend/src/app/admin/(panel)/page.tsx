import { requireAdmin, getAccessToken } from "@/lib/admin-auth";
import { serverApi } from "@/lib/api";
import { AdminHero } from "@/components/admin/admin-ui";
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
  unreadInbox?: number;
  underReviewCases?: number;
  verifiedCases?: number;
  casesMissingPublicEvidence?: number;
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
      id: string;
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
    { label: "Published (public site)", value: data?.publishedCases ?? 0, icon: Shield, href: "/admin/cases" },
    { label: "Draft / Review", value: data?.draftCases ?? 0, icon: FileText, href: "/admin/cases" },
    { label: "Critical + High", value: (data?.riskAnalysis?.summary.criticalCases ?? 0) + (data?.riskAnalysis?.summary.highRiskCases ?? 0), icon: AlertTriangle, href: "/admin/cases" },
    { label: "Hospitals", value: data?.totalHospitals ?? 0, icon: Building2, href: "/admin/hospitals" },
    { label: "Patients", value: data?.totalPatients ?? 0, icon: User, href: "/admin/patients" },
    { label: "Doctors", value: data?.totalDoctors ?? 0, icon: Stethoscope, href: "/admin/doctors" },
    { label: "Medications", value: data?.totalMedications ?? 0, icon: Pill, href: "/admin/medications" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl p-4 pb-8 sm:p-6 lg:p-8">
      <AdminHero>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-navy-900 dark:text-navy-50 sm:text-3xl">Intelligence Dashboard</h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-600 dark:text-navy-400">Medical incident analytics — admin-only investigation platform</p>
      </AdminHero>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card-interactive p-4 sm:p-5">
            <s.icon className="h-7 w-7 text-teal-600 dark:text-teal-400 sm:h-8 sm:w-8" />
            <p className="mt-2 text-2xl font-semibold tracking-tight text-navy-900 dark:text-navy-50 sm:mt-3 sm:text-3xl">{s.value}</p>
            <p className="text-xs text-navy-600 dark:text-navy-400 sm:text-sm">{s.label}</p>
          </Link>
        ))}
      </div>

      {(data?.unreadInbox ?? 0) > 0 || (data?.underReviewCases ?? 0) > 0 || (data?.casesMissingPublicEvidence ?? 0) > 0 ? (
        <section className="mt-6 card-surface border-amber-200/60 bg-amber-50/50 p-4 sm:p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
          <h2 className="font-semibold text-navy-900 dark:text-navy-100">Needs attention</h2>
          <ul className="mt-3 space-y-2 text-sm text-navy-700 dark:text-navy-300">
            {(data?.unreadInbox ?? 0) > 0 && (
              <li>
                <Link href="/admin/inbox" className="text-teal-700 underline">
                  {data?.unreadInbox} unread inbox message{(data?.unreadInbox ?? 0) === 1 ? "" : "s"}
                </Link>
              </li>
            )}
            {(data?.underReviewCases ?? 0) > 0 && (
              <li>{data?.underReviewCases} case{(data?.underReviewCases ?? 0) === 1 ? "" : "s"} awaiting review</li>
            )}
            {(data?.verifiedCases ?? 0) > 0 && (
              <li>{data?.verifiedCases} verified case{(data?.verifiedCases ?? 0) === 1 ? "" : "s"} ready to publish</li>
            )}
            {(data?.casesMissingPublicEvidence ?? 0) > 0 && (
              <li>
                {data?.casesMissingPublicEvidence} verified/published case
                {(data?.casesMissingPublicEvidence ?? 0) === 1 ? "" : "s"} without public evidence
              </li>
            )}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="card-surface p-4 sm:p-6">
          <h2 className="font-semibold text-navy-900 dark:text-navy-100">Cases by risk level</h2>
          <ul className="mt-4 space-y-2">
            {(data?.casesByRiskLevel ?? []).map((r) => (
              <li key={r.riskLevel} className="flex items-center justify-between text-sm">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK_LEVEL_COLORS[r.riskLevel]}`}>
                  {RISK_LEVEL_LABELS[r.riskLevel].en}
                </span>
                <span className="font-mono font-semibold text-navy-900 dark:text-navy-100">{r._count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-4 sm:p-6">
          <h2 className="font-semibold text-navy-900 dark:text-navy-100">Cases by category</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(data?.casesByCategory ?? []).map((c) => (
              <li key={c.category} className="flex justify-between text-navy-700 dark:text-navy-300">
                <span>{CATEGORY_LABELS[c.category]?.en ?? c.category}</span>
                <span className="font-mono font-semibold">{c._count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            High-risk hospitals
          </h2>
          <ul className="mt-4 divide-y divide-navy-100 dark:divide-navy-800">
            {(data?.riskAnalysis?.hospitalClusters ?? []).slice(0, 5).map((h) => (
              <li key={h.slug} className="py-3">
                <Link href={`/so/hospitals/${h.slug}`} className="link-theme">
                  <p className="font-medium text-navy-900 dark:text-navy-100">{h.hospitalName}</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    {h.caseCount} cases · {h.criticalCount} critical · {h.highCount} high · score {h.riskScore}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <Pill className="h-5 w-5 shrink-0 text-teal-600" />
            Trending medications
          </h2>
          <ul className="mt-4 divide-y divide-navy-100 dark:divide-navy-800">
            {(data?.trendingMedications ?? []).slice(0, 5).map((m, i) => (
              <li key={i} className="flex justify-between py-3 text-sm">
                <Link href={m.medication ? `/so/medications/${m.medication.slug}` : "#"} className="font-medium text-navy-900 link-theme dark:text-navy-100">
                  {m.medication?.name ?? "Unknown"}
                </Link>
                <span className="text-navy-500 dark:text-navy-400">{m.count} cases</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="card-surface p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900">
            <Activity className="h-5 w-5 shrink-0 text-teal-600" />
            Critical & high-risk cases
          </h2>
          <ul className="mt-4 divide-y divide-navy-100 dark:divide-navy-800">
            {(data?.riskAnalysis?.criticalCases ?? []).slice(0, 6).map((c) => (
              <li key={c.slug} className="py-3">
                <Link href={`/admin/cases/${c.id}`} className="link-theme">
                  <p className="font-medium text-navy-900 dark:text-navy-100">{c.title}</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    {c.caseNumber} · {c.hospital} ·{" "}
                    <span className={`rounded border px-1 ${RISK_LEVEL_COLORS[c.riskLevel]}`}>{c.riskLevel}</span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-4 sm:p-6">
          <h2 className="font-semibold text-navy-900 dark:text-navy-100">Recent cases</h2>
          <ul className="mt-4 divide-y divide-navy-100 dark:divide-navy-800">
            {(data?.recentCases ?? []).map((c) => (
              <li key={c.id} className="py-3">
                <Link href={`/admin/cases/${c.id}`} className="link-theme">
                  <p className="font-medium text-navy-900 dark:text-navy-100">{c.title}</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    {c.caseNumber} · {c.hospital?.name} · {c.patient?.fullName} · {c.status}
                    {c.riskLevel && ` · ${c.riskLevel}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-8 card-surface p-4 sm:mt-10 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-navy-900">
            {data?.canViewGlobalAudit ? "Audit log (all admins)" : "My audit log"}
          </h2>
          <Link href="/admin/audit" className="text-sm text-teal-700 underline">
            View full log
          </Link>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {(data?.recentLogs ?? []).map((log) => (
            <li key={log.id} className="flex flex-col gap-1 border-b border-navy-50 pb-3 last:border-0 dark:border-navy-800 sm:flex-row sm:justify-between sm:gap-4">
              <span className="text-navy-700 dark:text-navy-300">
                {log.action} {log.entityType}
                {data?.canViewGlobalAudit && log.admin && ` by ${log.admin.name}`}
              </span>
              <time className="shrink-0 text-xs text-navy-400">{new Date(log.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
