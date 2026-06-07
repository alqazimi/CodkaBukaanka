import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { serverApi } from "@/lib/api";
import { CaseCard } from "@/components/cases/CaseCard";
import { Link } from "@/i18n/routing";
import { formatDate, slugToTitle } from "@/lib/utils";
import { CATEGORY_BADGE_COLORS, CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS, WHAT_WENT_WRONG_BADGE_COLORS, WHAT_WENT_WRONG_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import type { CaseItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slugToTitle(slug) || "Patient" };
}

export default async function PatientDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

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
  }>(`/api/patients/${slug}`, { next: { revalidate: 60 } });

  if (!patient) notFound();

  const cases = patient.cases ?? patient.timeline ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="border-b border-navy-100 pb-8 dark:border-navy-800">
        <h1 className="font-serif text-3xl font-bold text-navy-900 dark:text-navy-50">{patient.fullName}</h1>
        <p className="mt-2 text-navy-600 dark:text-navy-400">
          {[patient.age && `Age ${patient.age}`, patient.gender].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-4 text-sm font-medium text-teal-700 dark:text-teal-400">{patient.totalCases} documented cases</p>
      </header>

      {patient.hospitals.length > 0 && (
        <section className="mt-10">
          <h2 className="section-title text-xl">Hospitals visited</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {patient.hospitals.map((h) => (
              <Link
                key={h.slug}
                href={`/hospitals/${h.slug}`}
                className="rounded-full bg-navy-50 px-4 py-2 text-sm text-navy-800 transition-colors hover:bg-navy-100 dark:bg-navy-800 dark:text-navy-200 dark:hover:bg-navy-700"
              >
                {h.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="section-title text-xl">Timeline of incidents</h2>
        <ol className="mt-6 space-y-0 border-l-2 border-teal-200 pl-6 dark:border-teal-800">
          {patient.timeline.map((ev) => (
            <li key={ev.slug} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full bg-teal-600 dark:bg-teal-500" />
              <time className="text-xs font-medium text-teal-700 dark:text-teal-400">{formatDate(ev.incidentDate, locale)}</time>
              <p className="font-mono text-xs text-navy-400 dark:text-navy-500">{ev.caseNumber}</p>
              <h3 className="mt-1 font-semibold text-navy-900 dark:text-navy-100">
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
                <Link href={`/hospitals/${ev.hospital.slug}`} className="text-sm text-navy-500 link-theme dark:text-navy-400">
                  {ev.hospital.name}
                </Link>
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
  );
}
