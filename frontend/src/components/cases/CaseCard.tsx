import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/Badge";
import { CATEGORY_LABELS, STATUS_COLORS, STATUS_LABELS, EVIDENCE_LEVEL_COLORS, EVIDENCE_LEVEL_LABELS, RISK_LEVEL_COLORS, RISK_LEVEL_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { CaseCategory, CaseItem, CaseStatus, EvidenceLevel, RiskLevel } from "@/types/entities";

export function CaseCard({ caseItem, locale }: { caseItem: CaseItem; locale: string }) {
  const lang = locale === "so" ? "so" : "en";
  const category = caseItem.category in CATEGORY_LABELS ? caseItem.category : "OTHER";
  const status = (caseItem.status in STATUS_LABELS ? caseItem.status : "UNDER_REVIEW") as CaseStatus;
  const evidenceLevel = (caseItem.evidenceLevel in EVIDENCE_LEVEL_LABELS ? caseItem.evidenceLevel : "LOW") as EvidenceLevel;
  const riskLevel: RiskLevel =
    caseItem.riskLevel && caseItem.riskLevel in RISK_LEVEL_LABELS
      ? caseItem.riskLevel
      : "MEDIUM";
  const catLabel = CATEGORY_LABELS[category as CaseCategory][lang];
  const statusLabel = STATUS_LABELS[status][lang];
  const evidenceLabel = EVIDENCE_LEVEL_LABELS[evidenceLevel][lang];
  const riskLabel = RISK_LEVEL_LABELS[riskLevel][lang];
  const patient = caseItem.patient ?? caseItem.victim;
  const description = caseItem.incidentDescription ?? "";

  return (
    <article className="group relative card-interactive flex h-full flex-col p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {caseItem.caseNumber && <span className="text-xs font-mono text-navy-400">{caseItem.caseNumber}</span>}
        <Badge className={STATUS_COLORS[status]}>{statusLabel}</Badge>
        <Badge className={RISK_LEVEL_COLORS[riskLevel]}>{riskLabel}</Badge>
        <Badge className={EVIDENCE_LEVEL_COLORS[evidenceLevel]}>{evidenceLabel}</Badge>
        <Badge className="bg-navy-50 text-navy-700 border-navy-200">{catLabel}</Badge>
      </div>
      <h3 className="font-serif text-lg font-semibold tracking-tight text-navy-900 transition-colors duration-200 group-hover:text-teal-800">
        <Link href={`/cases/${caseItem.slug}`} prefetch className="after:absolute after:inset-0 after:content-['']">
          {caseItem.title}
        </Link>
      </h3>
      {description && <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-navy-600">{description}</p>}
      <div className="relative mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-navy-500">
        {caseItem.hospital?.slug && (
          <Link href={`/hospitals/${caseItem.hospital.slug}`} prefetch className="relative z-10 transition-colors hover:text-teal-700">
            {caseItem.hospital.name}
          </Link>
        )}
        {patient?.slug && (
          <>
            {caseItem.hospital?.slug && <span>·</span>}
            <Link href={`/patients/${patient.slug}`} prefetch className="relative z-10 transition-colors hover:text-teal-700">
              {patient.fullName}
            </Link>
          </>
        )}
        {caseItem.medication?.slug && (
          <>
            {(caseItem.hospital?.slug || patient?.slug) && <span>·</span>}
            <Link href={`/medications/${caseItem.medication.slug}`} prefetch className="relative z-10 transition-colors hover:text-teal-700">
              {caseItem.medication.name}
            </Link>
          </>
        )}
        {(caseItem.hospital?.slug || patient?.slug || caseItem.medication?.slug) && <span>·</span>}
        {caseItem.incidentDate && <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-medium text-navy-600">{formatDate(caseItem.incidentDate, locale)}</span>}
      </div>
    </article>
  );
}
