import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { EntityProfileHeader, entityChipClass } from "@/components/layout/EntityProfileHeader";
import { Link } from "@/i18n/routing";
import { slugToTitle } from "@/lib/utils";
import type { CaseItem, PatientItem, HospitalItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slugToTitle(slug) || "Medication" };
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
  }>(`/api/medications/${slug}`, { next: { revalidate: 60 } });

  if (!medication) notFound();

  const cases = medication.cases ?? [];

  return (
    <div className="page-container">
      <EntityProfileHeader
        title={medication.name}
        subtitle={medication.type}
        meta={`${medication.totalCases} documented cases`}
      />

      {medication.hospitals.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl">Hospitals involved</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {medication.hospitals.map((h) => (
              <Link key={h.slug} href={`/hospitals/${h.slug}`} className={chipClass}>
                {h.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {medication.patients.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl">Patients affected</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {medication.patients.map((p) => (
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
