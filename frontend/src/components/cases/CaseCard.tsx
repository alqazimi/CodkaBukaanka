import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/Badge";
import {
  CATEGORY_BADGE_COLORS,
  CATEGORY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  EVIDENCE_LEVEL_COLORS,
  EVIDENCE_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  RISK_LEVEL_LABELS,
} from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { CaseCategory, CaseItem, CaseStatus, EvidenceLevel, RiskLevel } from "@/types/entities";

export function CaseCard({ caseItem, locale }: { caseItem: CaseItem; locale: string }) {
  const lang = locale === "so" ? "so" : "en";
  const category = caseItem.category in CATEGORY_LABELS ? caseItem.category : "OTHER";
  const status = (caseItem.status in STATUS_LABELS ? caseItem.status : "UNDER_REVIEW") as CaseStatus;
  const evidenceLevel = (caseItem.evidenceLevel in EVIDENCE_LEVEL_LABELS ? caseItem.evidenceLevel : "LOW") as EvidenceLevel;
  const riskLevel: RiskLevel =
    caseItem.riskLevel && caseItem.riskLevel in RISK_LEVEL_LABELS ? caseItem.riskLevel : "MEDIUM";
  const catLabel = CATEGORY_LABELS[category as CaseCategory][lang];
  const statusLabel = STATUS_LABELS[status][lang];
  const evidenceLabel = EVIDENCE_LEVEL_LABELS[evidenceLevel][lang];
  const riskLabel = RISK_LEVEL_LABELS[riskLevel][lang];
  const patient = caseItem.patient ?? caseItem.victim;
  const description = caseItem.incidentDescription ?? "";

  return (
    <article className="group relative card-interactive flex h-full flex-col overflow-hidden p-5 sm:p-6 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:scale-x-0 before:bg-gradient-to-r before:from-transparent before:via-red-500 before:to-transparent before:transition-transform before:duration-300 hover:before:scale-x-100">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {caseItem.caseNumber && (
          <span className="font-mono text-xs text-white/55">{caseItem.caseNumber}</span>
        )}
        <Badge className={STATUS_COLORS[status]}>{statusLabel}</Badge>
        <Badge className={RISK_LEVEL_COLORS[riskLevel]}>{riskLabel}</Badge>
        <Badge className={EVIDENCE_LEVEL_COLORS[evidenceLevel]}>{evidenceLabel}</Badge>
        <Badge className={CATEGORY_BADGE_COLORS}>{catLabel}</Badge>
      </div>
      <h3 className="font-serif text-lg font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-white">
        <Link href={`/cases/${caseItem.slug}`} prefetch className="after:absolute after:inset-0 after:content-['']">
          {caseItem.title}
        </Link>
      </h3>
      {description && (
        <p className="mt-2 line-clamp-3 flex-1 text-sm font-medium leading-relaxed text-white/75">
          {description}
        </p>
      )}
      <div className="relative mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/60">
        {caseItem.hospital?.slug && (
          <Link
            href={`/hospitals/${caseItem.hospital.slug}`}
            prefetch
            className="relative z-10 font-medium transition-colors hover:text-white"
          >
            {caseItem.hospital.name}
          </Link>
        )}
        {patient?.slug && (
          <>
            {caseItem.hospital?.slug && <span>·</span>}
            <Link
              href={`/patients/${patient.slug}`}
              prefetch
              className="relative z-10 font-medium transition-colors hover:text-white"
            >
              {patient.fullName}
            </Link>
          </>
        )}
        {caseItem.medication?.slug && (
          <>
            {(caseItem.hospital?.slug || patient?.slug) && <span>·</span>}
            <Link
              href={`/medications/${caseItem.medication.slug}`}
              prefetch
              className="relative z-10 font-medium transition-colors hover:text-white"
            >
              {caseItem.medication.name}
            </Link>
          </>
        )}
        {(caseItem.hospital?.slug || patient?.slug || caseItem.medication?.slug) && <span>·</span>}
        {caseItem.incidentDate && (
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/75 backdrop-blur-sm">
            {formatDate(caseItem.incidentDate, locale)}
          </span>
        )}
      </div>
    </article>
  );
}
