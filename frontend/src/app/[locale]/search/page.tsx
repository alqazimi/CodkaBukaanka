import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchQuickExamples } from "@/components/search/SearchQuickExamples";
import { SearchStartHelp } from "@/components/search/SearchStartHelp";
import { PageHeader } from "@/components/layout/PageHeader";
import { serverApi } from "@/lib/api";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search Archive" };

function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-44 rounded-2xl" />
      ))}
    </div>
  );
}

function hasActiveSearch(sp: Record<string, string | undefined>) {
  return !!(
    sp.q?.trim() ||
    sp.hospital ||
    sp.patient ||
    sp.victim ||
    sp.category ||
    sp.status ||
    sp.dateFrom ||
    sp.dateTo
  );
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const [t, filterOptions] = await Promise.all([
    getTranslations("search"),
    serverApi.get<{
      hospitals: { slug: string; name: string }[];
      patients: { slug: string; fullName: string }[];
    }>("/api/search/filters", { next: { revalidate: 300 } }),
  ]);

  const showStartHelp = !hasActiveSearch(sp);

  return (
    <div className="page-container">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="min-w-0 space-y-6">
        <div className="min-w-0">
          <GlobalSearchBar
            placeholder={t("placeholder")}
            defaultValue={sp.q}
            submitLabel={t("submit")}
            hint={t("hint")}
            size="large"
          />
          <SearchQuickExamples />
        </div>

        {showStartHelp && <SearchStartHelp />}

        <div className="grid gap-6 xl:grid-cols-12 xl:gap-8">
          <div className="min-w-0 xl:col-span-4">
            <SearchFiltersPanel options={filterOptions ?? { hospitals: [], patients: [] }} />
          </div>
          <div className="min-w-0 xl:col-span-8">
            <Suspense fallback={<ResultsSkeleton />}>
              <SearchResults locale={locale} searchParams={sp} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
