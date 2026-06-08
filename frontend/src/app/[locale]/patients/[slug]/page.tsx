import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { EntityProfileHeader, entityChipClass } from "@/components/layout/EntityProfileHeader";
import { Link } from "@/i18n/routing";
import { formatDate, slugToTitle } from "@/lib/utils";
import { CATEGORY_BADGE_COLORS, CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS, WHAT_WENT_WRONG_BADGE_COLORS, WHAT_WENT_WRONG_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { buildPageMetadata, SEO_BRAND } from "@/lib/seo";
import type { CaseItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const name = slugToTitle(slug) || "Patient";
  const description =
    locale === "so"
      ? `Kiisaska badbaadada bukaanka ee ${name} — kaydka ${SEO_BRAND.name}.`
      : `Verified patient safety cases involving ${name} on ${SEO_BRAND.name}.`;
  return buildPageMetadata({ title: name, description, locale, path: `/patients/${slug}` });
}

export default async function PatientDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const tNav = await getTranslations("nav");

  const patient = await serverApi.get<{
    fullName: string;
    slug: string;
    age?: number | null;
    gender?: string | null;
    totalCases: number;
    hospitals: { name: string; slug: string; location: string }[];
    timeline: {
      slug: string;
      caseNumber: string;
      title: string;
      category: CaseItem["category"];
      whatWentWrong: CaseItem["whatWentWrong"];
      status: CaseItem["status"];
      incidentDate: string;
      hospital: { name: string; slug: string };
    }[];
    cases: CaseItem[];
  }>(`/api/patients/${slug}`, { next: { revalidate: 120 } });

  if (!patient) notFound();

  const cases = patient.cases ?? patient.timeline ?? [];
  const timeline = patient.timeline ?? cases;
  const visitedHospitals = patient.hospitals ?? [];

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: SEO_BRAND.nameCompact, path: "" },
          { name: tNav("patients"), path: "/patients" },
          { name: patient.fullName },
        ]}
      />
      <div className="page-container">
      <EntityProfileHeader
        title={patient.fullName}
        subtitle={[patient.age && `Age ${patient.age}`, patient.gender].filter(Boolean).join(" · ")}
        meta={`${patient.totalCases} documented cases`}
      />

      {visitedHospitals.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl">Hospitals visited</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {visitedHospitals.map((h) => (
              <Link key={h.slug} href={`/hospitals/${h.slug}`} className={entityChipClass}>
                {h.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="section-title text-xl">Timeline of incidents</h2>
        <ol className="mt-6 space-y-0 border-l-2 border-red-400/40 pl-6">
          {timeline.map((ev) => (
            <li key={ev.slug} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-red-500" />
              <time className="text-xs font-semibold text-red-300">{formatDate(ev.incidentDate, locale)}</time>
              <p className="font-mono text-xs text-subtle">{ev.caseNumber}</p>
              <h3 className="mt-1 font-bold text-white">
                <Link href={`/cases/${ev.slug}`} className="link-theme">
                  {ev.title}
                </Link>
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className={STATUS_COLORS[ev.status] ?? STATUS_COLORS.UNDER_REVIEW}>
                  {STATUS_LABELS[ev.status]?.en ?? ev.status}
                </Badge>
                <Badge className={CATEGORY_BADGE_COLORS}>{CATEGORY_LABELS[ev.category]?.en ?? ev.category}</Badge>
                <Badge className={WHAT_WENT_WRONG_BADGE_COLORS}>
                  {WHAT_WENT_WRONG_LABELS[ev.whatWentWrong]?.en ?? ev.whatWentWrong}
                </Badge>
                {ev.hospital?.slug ? (
                  <Link href={`/hospitals/${ev.hospital.slug}`} className="link-theme text-sm">
                    {ev.hospital.name}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="section-title text-xl">All cases</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {cases.map((c) => (
            <CaseCard key={c.slug} caseItem={c} locale={locale} />
          ))}
        </div>
      </section>
    </div>
    </>
  );
}
