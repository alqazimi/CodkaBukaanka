"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Pill, Activity } from "lucide-react";
import { clientApi } from "@/lib/api";
import { RISK_LEVEL_COLORS } from "@/lib/constants";
import type { RiskLevel } from "@/types/entities";

type RiskAnalysis = {
  hospitalClusters: {
    hospitalName: string;
    slug: string;
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

export function AdminDashboardInsights() {
  const [risk, setRisk] = useState<RiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      clientApi.get<RiskAnalysis>("/api/admin/risk-analysis").then((data) => {
        if (cancelled) return;
        if (data) setRisk(data);
        setLoading(false);
      });
    };

    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(load, { timeout: 2_000 });
    } else {
      timerId = setTimeout(load, 300);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) clearTimeout(timerId);
    };
  }, []);

  if (loading && !risk) {
    return (
      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {[0, 1, 2, 3].map((i) => (
          <section key={i} className="card-surface animate-pulse p-4 sm:p-6">
            <div className="h-5 w-40 rounded bg-navy-100 dark:bg-navy-800" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="h-10 rounded bg-navy-50 dark:bg-navy-900/50" />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (!risk) return null;

  return (
    <>
      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="card-surface p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900 dark:text-navy-100">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            High-risk hospitals
          </h2>
          <ul className="mt-4 divide-y divide-navy-100 dark:divide-navy-800">
            {risk.hospitalClusters.slice(0, 5).map((h) => (
              <li key={h.slug} className="py-3">
                <Link href={`/so/hospitals/${h.slug}`} className="link-theme">
                  <p className="font-medium text-navy-900 dark:text-navy-100">{h.hospitalName}</p>
                  <p className="text-xs text-navy-500 dark:text-navy-400">
                    {h.caseCount} cases · {h.criticalCount} critical · {h.highCount} high · score {h.riskScore}
                  </p>
                </Link>
              </li>
            ))}
            {risk.hospitalClusters.length === 0 && (
              <li className="py-3 text-sm text-navy-500 dark:text-navy-400">No high-risk clusters detected.</li>
            )}
          </ul>
        </section>

        <section className="card-surface p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900 dark:text-navy-100">
            <Pill className="h-5 w-5 shrink-0 text-teal-600" />
            Trending medications
          </h2>
          <ul className="mt-4 divide-y divide-navy-100 dark:divide-navy-800">
            {risk.medicationPatterns.slice(0, 5).map((m) => (
              <li key={m.slug} className="flex justify-between py-3 text-sm">
                <Link href={`/so/medications/${m.slug}`} className="font-medium text-navy-900 link-theme dark:text-navy-100">
                  {m.name}
                </Link>
                <span className="text-navy-500 dark:text-navy-400">{m.caseCount} cases</span>
              </li>
            ))}
            {risk.medicationPatterns.length === 0 && (
              <li className="py-3 text-sm text-navy-500 dark:text-navy-400">No medication patterns yet.</li>
            )}
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <section className="card-surface p-4 sm:p-6">
          <h2 className="flex items-center gap-2 font-semibold text-navy-900 dark:text-navy-100">
            <Activity className="h-5 w-5 shrink-0 text-teal-600" />
            Critical & high-risk cases
          </h2>
          <ul className="mt-4 divide-y divide-navy-100 dark:divide-navy-800">
            {risk.criticalCases.slice(0, 6).map((c) => (
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
            {risk.criticalCases.length === 0 && (
              <li className="py-3 text-sm text-navy-500 dark:text-navy-400">No critical or high-risk cases.</li>
            )}
          </ul>
        </section>
      </div>
    </>
  );
}
