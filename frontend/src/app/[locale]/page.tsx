import { getTranslations, setRequestLocale } from "next-intl/server";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { SearchQuickExamples } from "@/components/search/SearchQuickExamples";
import { HomeSearchGuide } from "@/components/home/HomeSearchGuide";
import { CaseCard } from "@/components/cases/CaseCard";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { serverApi } from "@/lib/api";
import { CategoryBrowseGrid, getCachedCategoryCounts, getCategoriesWithCases } from "@/components/categories/CategoryBrowseGrid";
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
  const tSearch = await getTranslations("search");

  const [recent, stats, categoryCounts] = await Promise.all([
    serverApi.get<CaseItem[]>("/api/cases/recent?limit=6", { next: { revalidate: 120 } }),
    serverApi.get<{ totalCases: number; totalHospitals: number; totalPatients: number; totalDoctors: number; totalMedications: number }>("/api/stats", { next: { revalidate: 120 } }),
    getCachedCategoryCounts(),
  ]);

  const categoriesWithCases = getCategoriesWithCases(categoryCounts);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-10 xl:gap-14">
            <div className="min-w-0">
              <p className="hero-badge animate-fade-in">
                {t("heroBadge")}
              </p>
              <h1 className="hero-title animate-fade-in fade-in-delay-1 mt-4 text-balance font-display text-3xl font-bold leading-tight sm:mt-5 sm:text-4xl lg:text-[2.35rem] lg:leading-[1.15] xl:text-5xl">
                {t.rich("heroTitle", {
                  accent: (chunks) => <span className="hero-title-accent">{chunks}</span>,
                })}
              </h1>
              <p className="animate-fade-in fade-in-delay-2 mt-4 max-w-xl text-pretty text-base font-medium leading-relaxed text-[hsl(0_0%_96%/0.92)] sm:mt-6 sm:text-lg lg:max-w-none">
                {t("heroSubtitle")}
              </p>
            </div>

            <div className="hero-search glass-panel animate-fade-in fade-in-delay-3 mt-8 min-w-0 w-full p-4 sm:p-5 lg:mt-0">
              <GlobalSearchBar
                placeholder={t("searchPlaceholder")}
                submitLabel={t("searchButton")}
                hint={t("searchHint")}
                size="large"
              />
              <SearchQuickExamples />
            </div>
          </div>
        </div>
      </section>

      <HomeSearchGuide />

      {stats && (
        <section className="section-alt py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="sr-only">{t("statsTitle")}</h2>
            <div className="grid grid-cols-2 gap-3 min-[400px]:gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard value={stats.totalCases} label={tSearch("sectionCases")} icon={FileText} />
              <StatCard value={stats.totalHospitals} label={tSearch("sectionHospitals")} icon={Building2} />
              <StatCard value={stats.totalPatients} label={tSearch("sectionPatients")} icon={Users} />
              <StatCard value={stats.totalDoctors} label={tSearch("sectionDoctors")} icon={Stethoscope} />
              <StatCard value={stats.totalMedications} label={tSearch("sectionMedications")} icon={Pill} />
            </div>
          </div>
        </section>
      )}

      {categoriesWithCases.length > 0 && (
        <section className="page-container">
          <h2 className="section-title">{t("categoriesTitle")}</h2>
          <p className="section-subtitle">{t("categoriesSubtitle")}</p>
          <CategoryBrowseGrid locale={locale} counts={categoryCounts} hideWhenEmpty />
        </section>
      )}

      <section className="section-alt">
        <div className="page-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title">{t("recentTitle")}</h2>
              <p className="section-subtitle mt-1">{t("browseCasesDesc")}</p>
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
