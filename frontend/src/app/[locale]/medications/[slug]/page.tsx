import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { EntityProfileHeader, entityChipClass } from "@/components/layout/EntityProfileHeader";
import { Link } from "@/i18n/routing";
import { slugToTitle } from "@/lib/utils";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { buildPageMetadata, SEO_BRAND } from "@/lib/seo";
import type { CaseItem, PatientItem, HospitalItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const name = slugToTitle(slug) || "Medication";
  const description =
    locale === "so"
      ? `Kiisaska badbaadada bukaanka ee daawada ${name} — kaydka ${SEO_BRAND.name}.`
      : `Verified patient safety cases involving ${name} on ${SEO_BRAND.name}.`;
  return buildPageMetadata({ title: name, description, locale, path: `/medications/${slug}` });
}

const chipClass = entityChipClass;

export default async function MedicationDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const medication = await serverApi.get<{
    name: string;
    slug: string;
    type?: string | null;
    totalCases: number;
    hospitals: HospitalItem[];
    patients: PatientItem[];
    cases: CaseItem[];
  }>(`/api/medications/${slug}`, { next: { revalidate: 120 } });

  if (!medication) notFound();

  const cases = medication.cases ?? [];
  const hospitals = medication.hospitals ?? [];
  const relatedPatients = medication.patients ?? [];

  return (
    <div className="page-container">
      <EntityProfileHeader
        title={medication.name}
        subtitle={medication.type}
        meta={`${medication.totalCases} documented cases`}
      />

      {hospitals.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl">Hospitals involved</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {hospitals.map((h) => (
              <Link key={h.slug} href={`/hospitals/${h.slug}`} className={chipClass}>
                {h.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {relatedPatients.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl">Patients affected</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedPatients.map((p) => (
              <Link key={p.slug} href={`/patients/${p.slug}`} className={chipClass}>
                {p.fullName}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="section-title text-xl">Related cases</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {cases.map((c) => (
            <CaseCard key={c.slug} caseItem={c} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
