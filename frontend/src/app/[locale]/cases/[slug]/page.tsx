import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { serverApi } from "@/lib/api";
import {
  CATEGORY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  WHAT_WENT_WRONG_LABELS,
  EVIDENCE_LEVEL_COLORS,
  EVIDENCE_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/lib/constants";
import { formatDate, slugToTitle } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { DocumentList } from "@/components/evidence/DocumentList";
import { MediaGallery } from "@/components/evidence/MediaGallery";
import type { CaseItem } from "@/types/entities";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slugToTitle(slug) || "Case" };
}

export default async function CasePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const lang = locale === "so" ? "so" : "en";
  const labels = locale === "so"
    ? {
        hospital: "Isbitaal",
        patient: "Bukaan",
        doctor: "Dhakhtar",
        medication: "Daawo",
        incidentDate: "Taariikhda dhacdada",
        published: "La daabacay",
        reasonForVisit: "Sababta booqashada",
        incidentDescription: "Faahfaahinta dhacdada",
        currentCondition: "Xaaladda hadda",
        mediaEvidence: "Caddeyn — Warbaahin",
        docsEvidence: "Caddeyn — Dukumiinti",
        disclaimer:
          "Warbixintan waa qayb ka mid ah kayd baaritaan oo la xaqiijiyay. Macluumaadka waxaa laga soo ururiyay caddeymo ay maamulayaashu hubiyeen. Daabacaaddu ma aha go'aan sharci oo kama dambeys ah.",
      }
    : {
        hospital: "Hospital",
        patient: "Patient",
        doctor: "Doctor",
        medication: "Medication",
        incidentDate: "Incident date",
        published: "Published",
        reasonForVisit: "Reason for visit",
        incidentDescription: "Incident description",
        currentCondition: "Current condition",
        mediaEvidence: "Evidence — Media",
        docsEvidence: "Evidence — Documents",
        disclaimer:
          "This report is part of a verified investigative archive. Information is compiled from evidence reviewed by administrators. Publication does not constitute a legal determination of liability or wrongdoing.",
      };

  const caseRecord = await serverApi.get<CaseItem>(`/api/cases/slug/${slug}`, { next: { revalidate: 60 } });
  if (!caseRecord) notFound();

  const patient = caseRecord.patient ?? caseRecord.victim;
  const images = (caseRecord.evidence ?? []).filter((e) => e.type === "IMAGE");
  const videos = (caseRecord.evidence ?? []).filter((e) => e.type === "VIDEO");
  const documents = (caseRecord.evidence ?? []).filter((e) => e.type === "DOCUMENT");

  return (
    <article className="page-container-narrow animate-fade-in">
      <p className="font-mono text-sm tracking-wide text-navy-400">{caseRecord.caseNumber}</p>
      <div className="mb-6 mt-2 flex flex-wrap gap-2">
        <Badge className={STATUS_COLORS[caseRecord.status]}>{STATUS_LABELS[caseRecord.status][lang]}</Badge>
        <Badge className={RISK_LEVEL_COLORS[caseRecord.riskLevel ?? "MEDIUM"]}>
          {RISK_LEVEL_LABELS[caseRecord.riskLevel ?? "MEDIUM"][lang]}
        </Badge>
        <Badge className={EVIDENCE_LEVEL_COLORS[caseRecord.evidenceLevel]}>
          {EVIDENCE_LEVEL_LABELS[caseRecord.evidenceLevel][lang]}
        </Badge>
        <Badge className="bg-navy-50 text-navy-700 border-navy-200">{CATEGORY_LABELS[caseRecord.category][lang]}</Badge>
        <Badge className="bg-red-50 text-red-800 border-red-200">{WHAT_WENT_WRONG_LABELS[caseRecord.whatWentWrong][lang]}</Badge>
      </div>

      <h1 className="font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">{caseRecord.title}</h1>

      <dl className="card-surface mt-8 grid gap-5 bg-gradient-to-br from-white to-navy-50/40 p-6 sm:grid-cols-2">
        <div>
            <dt className="text-xs font-medium uppercase text-navy-500">{labels.hospital}</dt>
          <dd className="mt-1">
            <Link href={`/hospitals/${caseRecord.hospital.slug}`} className="font-medium text-teal-700 hover:underline">
              {caseRecord.hospital.name}
            </Link>
            {caseRecord.hospital.location && <p className="text-sm text-navy-500">{caseRecord.hospital.location}</p>}
          </dd>
        </div>
        {patient && (
          <div>
            <dt className="text-xs font-medium uppercase text-navy-500">{labels.patient}</dt>
            <dd className="mt-1">
              <Link href={`/patients/${patient.slug}`} className="font-medium text-teal-700 hover:underline">
                {patient.fullName}
              </Link>
            </dd>
          </div>
        )}
        {caseRecord.doctor && (
          <div>
            <dt className="text-xs font-medium uppercase text-navy-500">{labels.doctor}</dt>
            <dd className="mt-1">
              <Link href={`/doctors/${caseRecord.doctor.slug}`} className="font-medium text-teal-700 hover:underline">
                {caseRecord.doctor.fullName}
              </Link>
            </dd>
          </div>
        )}
        {caseRecord.medication && (
          <div>
            <dt className="text-xs font-medium uppercase text-navy-500">{labels.medication}</dt>
            <dd className="mt-1">
              <Link href={`/medications/${caseRecord.medication.slug}`} className="font-medium text-teal-700 hover:underline">
                {caseRecord.medication.name}
              </Link>
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-medium uppercase text-navy-500">{labels.incidentDate}</dt>
          <dd className="mt-1 font-medium text-navy-900">{formatDate(caseRecord.incidentDate, locale)}</dd>
        </div>
        {caseRecord.publishedAt && (
          <div>
            <dt className="text-xs font-medium uppercase text-navy-500">{labels.published}</dt>
            <dd className="mt-1 font-medium text-navy-900">{formatDate(caseRecord.publishedAt, locale)}</dd>
          </div>
        )}
      </dl>

      <aside className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm leading-relaxed text-amber-900">
        {labels.disclaimer}
      </aside>

      <section className="mt-10 space-y-8">
        <div className="card-surface p-6">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-navy-900">{labels.reasonForVisit}</h2>
          <p className="mt-3 leading-relaxed text-navy-700">{caseRecord.reasonForVisit}</p>
        </div>
        <div className="card-surface p-6">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-navy-900">{labels.incidentDescription}</h2>
          <div className="prose-archive mt-3 whitespace-pre-wrap leading-relaxed text-navy-700">{caseRecord.incidentDescription}</div>
        </div>
        {caseRecord.currentCondition && (
          <div className="card-surface p-6">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-navy-900">{labels.currentCondition}</h2>
            <p className="mt-3 leading-relaxed text-navy-700">{caseRecord.currentCondition}</p>
          </div>
        )}
      </section>

      {(images.length > 0 || videos.length > 0) && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-navy-900">{labels.mediaEvidence}</h2>
          <MediaGallery items={[...images, ...videos]} />
        </section>
      )}

      {documents.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-navy-900">{labels.docsEvidence}</h2>
          <DocumentList items={documents} />
        </section>
      )}
    </article>
  );
}
