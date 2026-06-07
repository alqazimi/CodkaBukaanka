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
import type { CaseCategory, CaseItem, CaseStatus, EvidenceLevel, RiskLevel, WhatWentWrong } from "@/types/entities";
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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-400/30 bg-red-950/30 text-red-300">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</p>
        <div className="mt-1 text-sm font-medium text-white/85">{children}</div>
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
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/30 bg-red-950/30 text-sm font-bold text-white">
            {step}
          </span>
          <span className="mt-2 w-px flex-1 bg-gradient-to-b from-red-400/40 to-transparent" />
        </div>
        <div className="card-surface min-w-0 flex-1 overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-5 py-4 sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-subtle sm:hidden">
              {String(step).padStart(2, "0")}
            </p>
            <h2 className="font-serif text-xl font-bold tracking-tight text-white sm:text-2xl">
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
  allowOpenOriginal = false,
}: {
  caseRecord: CaseItem;
  locale: string;
  labels: CaseReportLabels;
  /** Admin preview can open originals; public site uses preview-only for privacy. */
  allowOpenOriginal?: boolean;
}) {
  const lang = locale === "so" ? "so" : "en";
  const patient = caseRecord.patient ?? caseRecord.victim;
  const status = (caseRecord.status in STATUS_LABELS ? caseRecord.status : "PUBLISHED") as CaseStatus;
  const category = (caseRecord.category in CATEGORY_LABELS ? caseRecord.category : "OTHER") as CaseCategory;
  const evidenceLevel = (
    caseRecord.evidenceLevel && caseRecord.evidenceLevel in EVIDENCE_LEVEL_LABELS ? caseRecord.evidenceLevel : "LOW"
  ) as EvidenceLevel;
  const whatWentWrong = (
    caseRecord.whatWentWrong in WHAT_WENT_WRONG_LABELS ? caseRecord.whatWentWrong : "OTHER"
  ) as WhatWentWrong;
  const riskLevel = (
    caseRecord.riskLevel && caseRecord.riskLevel in RISK_LEVEL_LABELS ? caseRecord.riskLevel : "MEDIUM"
  ) as RiskLevel;
  const images = (caseRecord.evidence ?? []).filter((e) => e.type === "IMAGE");
  const videos = (caseRecord.evidence ?? []).filter((e) => e.type === "VIDEO");
  const documents = (caseRecord.evidence ?? []).filter((e) => e.type === "DOCUMENT");
  const mediaCount = images.length + videos.length;

  return (
    <article className="animate-fade-in">
      <header className="glass-panel relative overflow-hidden rounded-3xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,80,80,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 60%, rgba(180,0,0,0.2) 0%, transparent 40%)",
          }}
        />
        <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-xs tracking-wide text-white/85">
              {caseRecord.caseNumber}
            </span>
            <span className="text-xs font-medium uppercase tracking-widest text-red-300">
              {labels.verifiedReport}
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl font-serif text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
            {caseRecord.title}
          </h1>

          <div className="mt-6 flex flex-wrap gap-2">
            <Badge className={`${STATUS_COLORS[status]} ring-1 ring-white/10`}>
              {STATUS_LABELS[status][lang]}
            </Badge>
            <Badge className={`${RISK_LEVEL_COLORS[riskLevel]} ring-1 ring-white/10`}>
              {RISK_LEVEL_LABELS[riskLevel][lang]}
            </Badge>
            <Badge className={`${EVIDENCE_LEVEL_COLORS[evidenceLevel]} ring-1 ring-white/10`}>
              {EVIDENCE_LEVEL_LABELS[evidenceLevel][lang]}
            </Badge>
            <Badge className={`${CATEGORY_BADGE_COLORS} ring-1 ring-white/10`}>
              {CATEGORY_LABELS[category][lang]}
            </Badge>
            <Badge className={`${WHAT_WENT_WRONG_BADGE_COLORS} ring-1 ring-white/10`}>
              {WHAT_WENT_WRONG_LABELS[whatWentWrong][lang]}
            </Badge>
          </div>

          <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-400" />
              {labels.incidentDate}: {formatDate(caseRecord.incidentDate, locale)}
            </span>
            {caseRecord.publishedAt && (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-400" />
                {labels.published}: {formatDate(caseRecord.publishedAt, locale)}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-10 xl:gap-14">
        <div className="min-w-0 space-y-10">
          <aside className="card-surface flex gap-3 border-red-400/30 bg-red-950/30 p-5 text-sm font-medium leading-relaxed text-white/85">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <p>{labels.disclaimer}</p>
          </aside>

          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-subtle">
              {labels.narrative}
            </p>
            <div className="mt-6 space-y-8">
              <NarrativeBlock step={1} title={labels.reasonForVisit}>
                <p className="text-base font-medium leading-relaxed text-white/85">
                  {caseRecord.reasonForVisit}
                </p>
              </NarrativeBlock>

              <NarrativeBlock step={2} title={labels.incidentDescription}>
                <div className="prose-archive whitespace-pre-wrap">{caseRecord.incidentDescription}</div>
              </NarrativeBlock>

              {caseRecord.currentCondition && (
                <NarrativeBlock step={3} title={labels.currentCondition}>
                  <p className="text-base font-medium leading-relaxed text-white/85">
                    {caseRecord.currentCondition}
                  </p>
                </NarrativeBlock>
              )}
            </div>
          </div>

          {mediaCount > 0 && (
            <section className="scroll-mt-8">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/30 bg-red-950/30 text-red-300">
                    <ImageIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                      {labels.mediaEvidence}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{labels.evidenceSubtitle}</p>
                  </div>
                </div>
                <span className="rounded-full border border-red-400/30 bg-red-950/30 px-3 py-1 text-xs font-semibold text-red-200">
                  {mediaCount} {mediaCount === 1 ? "file" : "files"}
                </span>
              </div>
              <MediaGallery
                items={[...images, ...videos]}
                variant="report"
                allowOpenOriginal={allowOpenOriginal}
              />
            </section>
          )}

          {documents.length > 0 && (
            <section className="scroll-mt-8">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/30 bg-red-950/30 text-red-300">
                    <FileStack className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-white">
                      {labels.docsEvidence}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{labels.docsSubtitle}</p>
                  </div>
                </div>
              </div>
              <DocumentList items={documents} variant="report" />
            </section>
          )}
        </div>

        <aside className="mt-10 lg:sticky lg:top-24 lg:mt-0">
          <div className="glass-panel overflow-hidden">
            <div className="border-b border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-red-300">{labels.entities}</p>
            </div>
            <div className="px-5">
              {caseRecord.hospital?.slug ? (
                <MetaRow icon={Building2} label={labels.hospital}>
                  <Link href={`/hospitals/${caseRecord.hospital.slug}`} className="link-theme">
                    {caseRecord.hospital.name}
                  </Link>
                  {caseRecord.hospital.location && (
                    <p className="mt-1 text-xs font-normal text-subtle">{caseRecord.hospital.location}</p>
                  )}
                </MetaRow>
              ) : null}
              {patient && (
                <MetaRow icon={User} label={labels.patient}>
                  <Link href={`/patients/${patient.slug}`} className="link-theme">
                    {patient.fullName}
                  </Link>
                </MetaRow>
              )}
              {caseRecord.doctor && (
                <MetaRow icon={Stethoscope} label={labels.doctor}>
                  <Link href={`/doctors/${caseRecord.doctor.slug}`} className="link-theme">
                    {caseRecord.doctor.fullName}
                  </Link>
                </MetaRow>
              )}
              {caseRecord.medication && (
                <MetaRow icon={Pill} label={labels.medication}>
                  <Link
                    href={`/medications/${caseRecord.medication.slug}`}
                    className="link-theme"
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
