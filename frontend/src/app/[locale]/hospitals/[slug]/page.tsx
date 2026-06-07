import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { EntityProfileHeader, entityChipClass } from "@/components/layout/EntityProfileHeader";
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

  const relatedPatients = hospital.patients ?? hospital.victims ?? [];
  const cases = hospital.cases ?? [];

  return (
    <div className="page-container">
      <EntityProfileHeader
        title={hospital.name}
        subtitle={
          <>
            <p>{hospital.location}</p>
            {hospital.description && <p className="mt-3 max-w-3xl">{hospital.description}</p>}
          </>
        }
        meta={`${hospital.totalCases} ${isSo ? "kiisas la daabacay" : "published cases"}`}
      />

      {relatedPatients.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl">{isSo ? "Bukaannada isbitaalkan" : "Patients at this hospital"}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedPatients.map((v) => (
              <Link
                key={v.slug}
                href={`/patients/${v.slug}`}
                className={entityChipClass}
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
          {cases.map((c) => (
            <CaseCard key={c.slug} caseItem={c} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
