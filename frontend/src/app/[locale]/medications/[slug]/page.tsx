import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { Link } from "@/i18n/routing";
import { slugToTitle } from "@/lib/utils";
import type { CaseItem, PatientItem, HospitalItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slugToTitle(slug) || "Medication" };
}

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="border-b border-navy-100 pb-8">
        <h1 className="font-serif text-3xl font-bold text-navy-900">{medication.name}</h1>
        {medication.type && <p className="mt-2 text-navy-600">{medication.type}</p>}
        <p className="mt-4 text-sm font-medium text-teal-700">{medication.totalCases} documented cases</p>
      </header>

      {medication.hospitals.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-bold text-navy-900">Hospitals involved</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {medication.hospitals.map((h) => (
              <Link key={h.slug} href={`/hospitals/${h.slug}`} className="rounded-full bg-navy-50 px-4 py-2 text-sm text-navy-800 hover:bg-navy-100">
                {h.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {medication.patients.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-bold text-navy-900">Patients affected</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {medication.patients.map((p) => (
              <Link key={p.slug} href={`/patients/${p.slug}`} className="rounded-full bg-navy-50 px-4 py-2 text-sm text-navy-800 hover:bg-navy-100">
                {p.fullName}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-xl font-bold text-navy-900">Related cases</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {medication.cases.map((c) => (
            <CaseCard key={c.slug} caseItem={c} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
