import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";
import { SearchFiltersPanel } from "@/components/search/SearchFiltersPanel";
import { SearchResults } from "@/components/search/SearchResults";
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

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title={t("title")} description="Search patients, hospitals, doctors, medications, and verified case records.">
        <div className="w-full max-w-xl sm:w-auto">
          <GlobalSearchBar placeholder="Search archive..." defaultValue={sp.q} />
        </div>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-4 xl:col-span-3">
          <SearchFiltersPanel options={filterOptions ?? { hospitals: [], patients: [] }} />
        </div>
        <div className="lg:col-span-8 xl:col-span-9">
          <Suspense fallback={<ResultsSkeleton />}>
            <SearchResults locale={locale} searchParams={sp} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
