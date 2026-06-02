import { getTranslations, setRequestLocale } from "next-intl/server";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { CaseCard } from "@/components/cases/CaseCard";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { serverApi } from "@/lib/api";
import { Link } from "@/i18n/routing";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { FileText, Building2, Users, Stethoscope, Pill } from "lucide-react";
import type { CaseItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  return { title: t("name"), description: t("description") };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const lang = locale === "so" ? "so" : "en";

  const [recent, stats] = await Promise.all([
    serverApi.get<CaseItem[]>("/api/cases/recent?limit=6", { next: { revalidate: 60 } }),
    serverApi.get<{ totalCases: number; totalHospitals: number; totalPatients: number; totalDoctors: number; totalMedications: number }>("/api/stats", { next: { revalidate: 60 } }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/25 via-transparent to-transparent" />
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="animate-fade-in text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Investigative Archive</p>
          <h1 className="animate-fade-in mt-4 max-w-3xl font-serif text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="animate-fade-in mt-6 max-w-2xl text-base leading-relaxed text-navy-200 sm:text-lg">{t("heroSubtitle")}</p>
          <div className="hero-search animate-fade-in mt-10 max-w-2xl rounded-3xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
            <GlobalSearchBar placeholder="Search patients, hospitals, doctors, medications, cases..." />
          </div>
        </div>
      </section>

      {stats && (
        <section className="section-alt py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard value={stats.totalCases} label="Published Cases" icon={FileText} />
              <StatCard value={stats.totalHospitals} label="Hospitals" icon={Building2} />
              <StatCard value={stats.totalPatients} label="Patients" icon={Users} />
              <StatCard value={stats.totalDoctors} label="Doctors" icon={Stethoscope} />
              <StatCard value={stats.totalMedications} label="Medications" icon={Pill} />
            </div>
          </div>
        </section>
      )}

      <section className="page-container">
        <h2 className="section-title">{t("categoriesTitle")}</h2>
        <p className="section-subtitle">Browse verified records by incident category.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/search?category=${cat}`}
              className="card-interactive px-4 py-3.5 text-sm font-medium text-navy-800 dark:text-navy-200"
            >
              {CATEGORY_LABELS[cat][lang]}
            </Link>
          ))}
        </div>
      </section>

      <section className="section-alt">
        <div className="page-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title">{t("recentTitle")}</h2>
              <p className="section-subtitle mt-1">Latest administrator-verified incident records.</p>
            </div>
            <Button href="/search" variant="outline">{t("viewAll")}</Button>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(recent ?? []).map((c) => (
              <CaseCard key={c.slug} caseItem={c} locale={locale} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
