import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { Link } from "@/i18n/routing";
import { HospitalCaseFilters } from "@/components/hospitals/HospitalCaseFilters";
import { Suspense } from "react";
import { slugToTitle } from "@/lib/utils";
import type { CaseItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slugToTitle(slug) || "Hospital" };
}

export default async function HospitalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("hospital");
  const isSo = locale === "so";

  const qs = new URLSearchParams();
  if (sp.category) qs.set("category", sp.category);
  if (sp.dateFrom) qs.set("dateFrom", sp.dateFrom);
  if (sp.dateTo) qs.set("dateTo", sp.dateTo);

  const hospital = await serverApi.get<{
    name: string;
    slug: string;
    location: string;
    description?: string | null;
    totalCases: number;
    victims: { fullName: string; slug: string; caseCount: number }[];
    patients?: { fullName: string; slug: string; caseCount: number }[];
    cases: CaseItem[];
  }>(`/api/hospitals/${slug}?${qs.toString()}`, { next: { revalidate: 60 } });

  if (!hospital) notFound();

  const relatedPatients = hospital.patients ?? hospital.victims;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="border-b border-navy-100 pb-8 dark:border-navy-800">
        <h1 className="font-serif text-3xl font-bold text-navy-900 dark:text-navy-50">{hospital.name}</h1>
        <p className="mt-2 text-navy-600 dark:text-navy-400">{hospital.location}</p>
        {hospital.description && (
          <p className="mt-4 max-w-3xl text-navy-700 dark:text-navy-300">{hospital.description}</p>
        )}
        <p className="mt-4 text-sm font-medium text-teal-700 dark:text-teal-400">
          {hospital.totalCases} {isSo ? "kiisas la daabacay" : "published cases"}
        </p>
      </header>

      {relatedPatients.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl">{isSo ? "Bukaannada isbitaalkan" : "Patients at this hospital"}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedPatients.map((v) => (
              <Link
                key={v.slug}
                href={`/patients/${v.slug}`}
                className="rounded-full bg-teal-50 px-4 py-2 text-sm text-teal-800 transition-colors hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-200 dark:hover:bg-teal-900/50"
              >
                {v.fullName} ({v.caseCount})
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="section-title text-xl">{t("reports")}</h2>
        <Suspense fallback={null}>
          <HospitalCaseFilters />
        </Suspense>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hospital.cases.map((c) => (
            <CaseCard key={c.slug} caseItem={c} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
