import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { EntityProfileHeader } from "@/components/layout/EntityProfileHeader";
import { Link } from "@/i18n/routing";
import { slugToTitle } from "@/lib/utils";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { buildPageMetadata, SEO_BRAND } from "@/lib/seo";
import type { CaseItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const name = slugToTitle(slug) || "Doctor";
  const description =
    locale === "so"
      ? `Kiisaska badbaadada bukaanka ee dhakhtarka ${name} — kaydka ${SEO_BRAND.name}.`
      : `Verified patient safety cases involving Dr. ${name} on ${SEO_BRAND.name}.`;
  return buildPageMetadata({ title: name, description, locale, path: `/doctors/${slug}` });
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
  }>(`/api/doctors/${slug}`, { next: { revalidate: 120 } });

  if (!doctor) notFound();

  const cases = doctor.cases ?? [];

  return (
    <div className="page-container">
      <EntityProfileHeader
        title={doctor.fullName}
        subtitle={
          <>
            {doctor.specialty && <p>{doctor.specialty}</p>}
            {doctor.hospital && (
              <p className="mt-1">
                <Link href={`/hospitals/${doctor.hospital.slug}`} className="link-theme">
                  {doctor.hospital.name}
                </Link>
              </p>
            )}
          </>
        }
        meta={`${doctor.totalCases} documented cases`}
      />
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
