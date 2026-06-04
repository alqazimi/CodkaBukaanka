import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/Badge";
import {
  CATEGORY_BADGE_COLORS,
  CATEGORY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  WHAT_WENT_WRONG_BADGE_COLORS,
  WHAT_WENT_WRONG_LABELS,
  EVIDENCE_LEVEL_COLORS,
  EVIDENCE_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { MediaGallery } from "@/components/evidence/EvidenceMedia";
import { DocumentList } from "@/components/evidence/DocumentList";
import type { CaseItem } from "@/types/entities";
import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  FileStack,
  ImageIcon,
  Pill,
  Stethoscope,
  User,
} from "lucide-react";

export type CaseReportLabels = {
  hospital: string;
  patient: string;
  doctor: string;
  medication: string;
  incidentDate: string;
  published: string;
  reasonForVisit: string;
  incidentDescription: string;
  currentCondition: string;
  mediaEvidence: string;
  docsEvidence: string;
  disclaimer: string;
  verifiedReport: string;
  entities: string;
  narrative: string;
  evidenceSubtitle: string;
  docsSubtitle: string;
};

function MetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 border-b border-white/10 py-4 last:border-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-teal-200">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-200/90">{label}</p>
        <div className="mt-1 text-sm font-medium text-white">{children}</div>
      </div>
    </div>
  );
}

function NarrativeBlock({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="relative pl-0 sm:pl-2">
      <div className="flex gap-4 sm:gap-5">
        <div
          className="hidden shrink-0 flex-col items-center sm:flex"
          aria-hidden
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-sm font-bold text-white shadow-md shadow-teal-500/25">
            {step}
          </span>
          <span className="mt-2 w-px flex-1 bg-gradient-to-b from-teal-300/60 to-transparent dark:from-teal-600/40" />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-navy-100/90 bg-white shadow-soft dark:border-navy-800/90 dark:bg-navy-900/95">
          <div className="border-b border-navy-100/80 bg-gradient-to-r from-navy-50/80 to-white px-5 py-4 dark:border-navy-800 dark:from-navy-950/80 dark:to-navy-900/95 sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-teal-700 dark:text-teal-400 sm:hidden">
              {String(step).padStart(2, "0")}
            </p>
            <h2 className="font-serif text-xl font-semibold tracking-tight text-navy-950 dark:text-navy-50 sm:text-2xl">
              {title}
            </h2>
          </div>
          <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

export function CasePublicReport({
  caseRecord,
  locale,
  labels,
}: {
  caseRecord: CaseItem;
  locale: string;
  labels: CaseReportLabels;
}) {
  const lang = locale === "so" ? "so" : "en";
  const patient = caseRecord.patient ?? caseRecord.victim;
  const images = (caseRecord.evidence ?? []).filter((e) => e.type === "IMAGE");
  const videos = (caseRecord.evidence ?? []).filter((e) => e.type === "VIDEO");
  const documents = (caseRecord.evidence ?? []).filter((e) => e.type === "DOCUMENT");
  const mediaCount = images.length + videos.length;

  return (
    <article className="animate-fade-in">
      <header className="relative overflow-hidden rounded-3xl border border-navy-800/20 bg-gradient-to-br from-navy-950 via-navy-900 to-teal-950 text-white shadow-xl shadow-navy-950/20 dark:border-navy-700/40">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(20,184,166,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 60%, rgba(6,182,212,0.2) 0%, transparent 40%)",
          }}
        />
        <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
          <div className="flex flex-wrap items-center gap-2 text-teal-200/90">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs tracking-wide">
              {caseRecord.caseNumber}
            </span>
            <span className="text-xs font-medium uppercase tracking-widest text-teal-300/80">
              {labels.verifiedReport}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl font-serif text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {caseRecord.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge className={`${STATUS_COLORS[caseRecord.status]} ring-1 ring-white/10`}>
              {STATUS_LABELS[caseRecord.status][lang]}
            </Badge>
            <Badge className={`${RISK_LEVEL_COLORS[caseRecord.riskLevel ?? "MEDIUM"]} ring-1 ring-white/10`}>
              {RISK_LEVEL_LABELS[caseRecord.riskLevel ?? "MEDIUM"][lang]}
            </Badge>
            <Badge className={`${EVIDENCE_LEVEL_COLORS[caseRecord.evidenceLevel]} ring-1 ring-white/10`}>
              {EVIDENCE_LEVEL_LABELS[caseRecord.evidenceLevel][lang]}
            </Badge>
            <Badge className={`${CATEGORY_BADGE_COLORS} ring-1 ring-white/10`}>
              {CATEGORY_LABELS[caseRecord.category][lang]}
            </Badge>
            <Badge className={`${WHAT_WENT_WRONG_BADGE_COLORS} ring-1 ring-white/10`}>
              {WHAT_WENT_WRONG_LABELS[caseRecord.whatWentWrong][lang]}
            </Badge>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-navy-200">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-400" />
              {labels.incidentDate}: {formatDate(caseRecord.incidentDate, locale)}
            </span>
            {caseRecord.publishedAt && (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-teal-400" />
                {labels.published}: {formatDate(caseRecord.publishedAt, locale)}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-10 xl:gap-14">
        <div className="min-w-0 space-y-10">
          <aside className="flex gap-3 rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-amber-50/40 p-5 text-sm leading-relaxed text-amber-950 shadow-sm dark:border-amber-800/50 dark:from-amber-950/50 dark:to-amber-950/20 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>{labels.disclaimer}</p>
          </aside>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-teal-700 dark:text-teal-400">
              {labels.narrative}
            </p>
            <div className="mt-6 space-y-8">
              <NarrativeBlock step={1} title={labels.reasonForVisit}>
                <p className="text-base leading-relaxed text-navy-700 dark:text-navy-300">
                  {caseRecord.reasonForVisit}
                </p>
              </NarrativeBlock>

              <NarrativeBlock step={2} title={labels.incidentDescription}>
                <div className="prose-archive whitespace-pre-wrap">{caseRecord.incidentDescription}</div>
              </NarrativeBlock>

              {caseRecord.currentCondition && (
                <NarrativeBlock step={3} title={labels.currentCondition}>
                  <p className="text-base leading-relaxed text-navy-700 dark:text-navy-300">
                    {caseRecord.currentCondition}
                  </p>
                </NarrativeBlock>
              )}
            </div>
          </div>

          {mediaCount > 0 && (
            <section className="scroll-mt-8">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-100 pb-4 dark:border-navy-800">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
                    <ImageIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 dark:text-navy-50">
                      {labels.mediaEvidence}
                    </h2>
                    <p className="mt-1 text-sm text-navy-600 dark:text-navy-400">{labels.evidenceSubtitle}</p>
                  </div>
                </div>
                <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700 dark:bg-navy-800 dark:text-navy-300">
                  {mediaCount} {mediaCount === 1 ? "file" : "files"}
                </span>
              </div>
              <MediaGallery items={[...images, ...videos]} variant="report" />
            </section>
          )}

          {documents.length > 0 && (
            <section className="scroll-mt-8">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy-100 pb-4 dark:border-navy-800">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-100 text-navy-700 dark:bg-navy-800 dark:text-navy-200">
                    <FileStack className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold tracking-tight text-navy-950 dark:text-navy-50">
                      {labels.docsEvidence}
                    </h2>
                    <p className="mt-1 text-sm text-navy-600 dark:text-navy-400">{labels.docsSubtitle}</p>
                  </div>
                </div>
              </div>
              <DocumentList items={documents} variant="report" />
            </section>
          )}
        </div>

        <aside className="mt-10 lg:sticky lg:top-24 lg:mt-0">
          <div className="overflow-hidden rounded-2xl border border-navy-200/80 bg-gradient-to-b from-navy-900 to-navy-950 text-white shadow-lg dark:border-navy-700">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">{labels.entities}</p>
            </div>
            <div className="px-5">
              <MetaRow icon={Building2} label={labels.hospital}>
                <Link href={`/hospitals/${caseRecord.hospital.slug}`} className="text-teal-300 hover:text-teal-200">
                  {caseRecord.hospital.name}
                </Link>
                {caseRecord.hospital.location && (
                  <p className="mt-1 text-xs font-normal text-navy-300">{caseRecord.hospital.location}</p>
                )}
              </MetaRow>
              {patient && (
                <MetaRow icon={User} label={labels.patient}>
                  <Link href={`/patients/${patient.slug}`} className="text-teal-300 hover:text-teal-200">
                    {patient.fullName}
                  </Link>
                </MetaRow>
              )}
              {caseRecord.doctor && (
                <MetaRow icon={Stethoscope} label={labels.doctor}>
                  <Link href={`/doctors/${caseRecord.doctor.slug}`} className="text-teal-300 hover:text-teal-200">
                    {caseRecord.doctor.fullName}
                  </Link>
                </MetaRow>
              )}
              {caseRecord.medication && (
                <MetaRow icon={Pill} label={labels.medication}>
                  <Link
                    href={`/medications/${caseRecord.medication.slug}`}
                    className="text-teal-300 hover:text-teal-200"
                  >
                    {caseRecord.medication.name}
                  </Link>
                </MetaRow>
              )}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
