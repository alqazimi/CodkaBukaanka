import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { Link } from "@/i18n/routing";
import { slugToTitle } from "@/lib/utils";
import type { CaseItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slugToTitle(slug) || "Doctor" };
}

export default async function DoctorDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const doctor = await serverApi.get<{
    fullName: string;
    slug: string;
    specialty?: string | null;
    hospital?: { name: string; slug: string; location: string } | null;
    totalCases: number;
    cases: CaseItem[];
  }>(`/api/doctors/${slug}`, { next: { revalidate: 60 } });

  if (!doctor) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="border-b border-navy-100 pb-8">
        <h1 className="font-serif text-3xl font-bold text-navy-900">{doctor.fullName}</h1>
        {doctor.specialty && <p className="mt-2 text-navy-600">{doctor.specialty}</p>}
        {doctor.hospital && (
          <p className="mt-2">
            <Link href={`/hospitals/${doctor.hospital.slug}`} className="text-teal-700 hover:underline">
              {doctor.hospital.name}
            </Link>
          </p>
        )}
        <p className="mt-4 text-sm font-medium text-teal-700">{doctor.totalCases} documented cases</p>
      </header>
      <section className="mt-12">
        <h2 className="font-serif text-xl font-bold text-navy-900">Related cases</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {doctor.cases.map((c) => (
            <CaseCard key={c.slug} caseItem={c} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
