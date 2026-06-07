import { redirectIfSessionExpired } from "@/lib/admin-auth";
import { adminServerGet } from "@/lib/server-admin-api";
import { AdminHero } from "@/components/admin/admin-ui";
import { AdminApiErrorBanner } from "@/components/admin/AdminApiErrorBanner";
import { AdminDashboardInsights } from "@/components/admin/AdminDashboardInsights";
import { FileText, Building2, User, Stethoscope, Pill, AlertTriangle, Shield } from "lucide-react";
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
  casesWithStaleLocalEvidence?: number;
  casesByHospital: { hospital: { name: string; slug: string; location: string } | null | undefined; count: number }[];
  casesByCategory: { category: CaseCategory; _count: number }[];
  casesByRiskLevel: { riskLevel: RiskLevel; _count: number }[];
  trendingMedications: { medication: { name: string; slug: string } | null | undefined; count: number }[];
  riskAnalysis?: {
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
  storageStatus?: {
    cloudinaryConfigured: boolean;
    uploadsReady: boolean;
    message?: string | null;
  };
  recentLogs: { id: string; action: string; entityType: string; createdAt: string; admin?: { name: string } }[];
};

function sumRiskCounts(rows: { riskLevel: RiskLevel; _count: number }[], ...levels: RiskLevel[]): number {
  return levels.reduce((sum, level) => sum + (rows.find((r) => r.riskLevel === level)?._count ?? 0), 0);
}

export default async function AdminDashboardPage() {
  const { data, error: loadError, code } = await adminServerGet<Analytics>("/api/admin/dashboard?quick=1");
  redirectIfSessionExpired({ code, error: loadError });

  const criticalHigh =
    sumRiskCounts(data?.casesByRiskLevel ?? [], "CRITICAL", "HIGH") ||
    (data?.riskAnalysis?.summary?.criticalCases ?? 0) + (data?.riskAnalysis?.summary?.highRiskCases ?? 0);

  const stats = [
    { label: "Total Cases", value: data?.totalCases ?? 0, icon: FileText, href: "/admin/cases" },
    { label: "Published (public site)", value: data?.publishedCases ?? 0, icon: Shield, href: "/admin/cases" },
    { label: "Draft / Review", value: data?.draftCases ?? 0, icon: FileText, href: "/admin/cases" },
    { label: "Critical + High", value: criticalHigh, icon: AlertTriangle, href: "/admin/cases" },
    { label: "Hospitals", value: data?.totalHospitals ?? 0, icon: Building2, href: "/admin/hospitals" },
    { label: "Patients", value: data?.totalPatients ?? 0, icon: User, href: "/admin/patients" },
    { label: "Doctors", value: data?.totalDoctors ?? 0, icon: Stethoscope, href: "/admin/doctors" },
    { label: "Medications", value: data?.totalMedications ?? 0, icon: Pill, href: "/admin/medications" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl p-4 pb-8 sm:p-6 lg:p-8">
      <AdminHero>
        <h1 className="section-title text-2xl sm:text-3xl">Admin Dashboard</h1>
        <p className="section-subtitle mt-2">
          Manage cases, hospitals, and records here. Only published cases appear on the public site.
        </p>
      </AdminHero>

      {loadError ? <AdminApiErrorBanner message={loadError} /> : null}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card-interactive p-4 sm:p-5">
            <s.icon className="h-7 w-7 text-red-400 sm:h-8 sm:w-8" />
            <p className="mt-2 text-2xl font-bold tracking-tight text-white sm:mt-3 sm:text-3xl">{s.value}</p>
            <p className="text-xs text-muted sm:text-sm">{s.label}</p>
          </Link>
        ))}
      </div>

      {(data?.unreadInbox ?? 0) > 0 ||
      (data?.underReviewCases ?? 0) > 0 ||
      (data?.casesMissingPublicEvidence ?? 0) > 0 ||
      (data?.casesWithStaleLocalEvidence ?? 0) > 0 ||
      (data?.storageStatus?.message && !data.storageStatus.uploadsReady) ? (
        <section className="mt-6 card-surface border-red-400/30 bg-red-950/20 p-4 sm:p-6">
          <h2 className="font-bold text-white">Needs attention</h2>
          <ul className="mt-3 space-y-2 text-sm font-medium text-white/85">
            {(data?.unreadInbox ?? 0) > 0 && (
              <li>
                <Link href="/admin/inbox" className="link-theme">
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
            {(data?.casesWithStaleLocalEvidence ?? 0) > 0 && (
              <li>
                <Link href="/admin/cases?staleEvidence=1" className="link-theme">
                  {data?.casesWithStaleLocalEvidence} case
                  {(data?.casesWithStaleLocalEvidence ?? 0) === 1 ? "" : "s"} with evidence that needs re-upload
                </Link>
              </li>
            )}
            {data?.storageStatus?.message && !data.storageStatus.uploadsReady ? (
              <li className="text-red-200">{data.storageStatus.message}</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="card-surface p-4 sm:p-6">
          <h2 className="font-bold text-white">Cases by risk level</h2>
          <ul className="mt-4 space-y-2">
            {(data?.casesByRiskLevel ?? []).map((r) => (
              <li key={r.riskLevel} className="flex items-center justify-between text-sm">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${RISK_LEVEL_COLORS[r.riskLevel]}`}>
                  {RISK_LEVEL_LABELS[r.riskLevel]?.en ?? r.riskLevel}
                </span>
                <span className="font-mono font-bold text-white">{r._count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-surface p-4 sm:p-6">
          <h2 className="font-bold text-white">Cases by category</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(data?.casesByCategory ?? []).map((c) => (
              <li key={c.category} className="flex justify-between font-medium text-white/85">
                <span>{CATEGORY_LABELS[c.category]?.en ?? c.category}</span>
                <span className="font-mono font-semibold">{c._count}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <AdminDashboardInsights />

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="card-surface p-4 sm:p-6">
          <h2 className="font-bold text-white">Recent cases</h2>
          <ul className="mt-4 divide-y divide-white/10">
            {(data?.recentCases ?? []).map((c) => (
              <li key={c.id} className="py-3">
                <Link href={`/admin/cases/${c.id}`} className="link-theme">
                  <p className="font-semibold text-white">{c.title}</p>
                  <p className="text-xs text-muted">
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
          <h2 className="font-bold text-white">
            {data?.canViewGlobalAudit ? "Audit log (all admins)" : "My audit log"}
          </h2>
          <Link href="/admin/audit" className="link-theme text-sm">
            View full log
          </Link>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {(data?.recentLogs ?? []).map((log) => (
            <li key={log.id} className="flex flex-col gap-1 border-b border-white/10 pb-3 last:border-0 sm:flex-row sm:justify-between sm:gap-4">
              <span className="font-medium text-white/85">
                {log.action} {log.entityType}
                {data?.canViewGlobalAudit && log.admin && ` by ${log.admin.name}`}
              </span>
              <time className="shrink-0 text-xs text-subtle">{new Date(log.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
