import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/layout/PageHeader";
import type { LegalContentSection, LegalDocumentContent } from "@/content/legal/types";
import { FileText, Scale, Shield } from "lucide-react";

export type LegalDocLabels = {
  lastUpdated: string;
  onThisPage: string;
  relatedDocuments: string;
  privacyPolicy: string;
  termsOfUse: string;
  requestCorrection: string;
  contact: string;
  documentBadge: string;
};

const DOCUMENT_ICONS = {
  privacy: Shield,
  terms: Scale,
} as const;

function renderSectionBody(section: LegalContentSection, depth = 0) {
  return (
    <>
      {section.paragraphs.map((paragraph) => (
        <p
          key={paragraph.slice(0, 48)}
          className="text-sm font-medium leading-relaxed text-white/75 sm:text-base"
        >
          {paragraph}
        </p>
      ))}
      {section.listItems && section.listItems.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {section.listItems.map((item) => (
            <li
              key={item.slice(0, 48)}
              className="flex gap-3 text-sm font-medium leading-relaxed text-white/75 sm:text-base"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/80" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {section.orderedListItems && section.orderedListItems.length > 0 && (
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-medium leading-relaxed text-white/75 sm:text-base">
          {section.orderedListItems.map((item) => (
            <li key={item.slice(0, 48)}>{item}</li>
          ))}
        </ol>
      )}
      {section.subsections?.map((subsection) => (
        <div key={subsection.id} className="mt-6 border-t border-white/10 pt-6">
          <h3 className="mb-3 font-serif text-lg font-bold text-white">{subsection.title}</h3>
          {renderSectionBody(subsection, depth + 1)}
        </div>
      ))}
    </>
  );
}

export function LegalDocumentView({
  document,
  labels,
}: {
  document: LegalDocumentContent;
  labels: LegalDocLabels;
}) {
  const Icon = DOCUMENT_ICONS[document.id as keyof typeof DOCUMENT_ICONS] ?? FileText;
  const otherDoc =
    document.id === "privacy"
      ? { href: "/terms" as const, label: labels.termsOfUse }
      : { href: "/privacy" as const, label: labels.privacyPolicy };

  return (
    <>
      <div className="page-container pb-2">
        <PageHeader title={document.title} />

        <div className="flex flex-wrap items-center gap-3">
          <span className="hero-badge">{labels.documentBadge}</span>
          <span className="chip">
            {labels.lastUpdated}: {document.lastUpdated}
          </span>
        </div>
      </div>

      <section className="section-alt py-10 sm:py-12">
        <div className="page-container py-0">
          <div className="glass-panel border-red-400/35 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/35 bg-red-500/10">
                <Icon className="h-6 w-6 text-red-300" aria-hidden />
              </span>
              <p className="min-w-0 text-sm font-medium leading-relaxed text-white/80 sm:text-base">
                {document.intro}
              </p>
            </div>
          </div>

          <nav
            className="legal-toc-mobile mt-6 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            aria-label={labels.onThisPage}
          >
            {document.sections.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="legal-toc-link shrink-0">
                {section.title.replace(/^\d+\.\s*/, "")}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <div className="page-container py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="legal-toc-sidebar sticky top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                {labels.onThisPage}
              </p>
              <ul className="mt-4 space-y-1">
                {document.sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="legal-toc-link block">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
                  {labels.relatedDocuments}
                </p>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link href={otherDoc.href} prefetch className="legal-related-link">
                      {otherDoc.label}
                    </Link>
                  </li>
                  <li>
                    <Link href="/corrections" prefetch className="legal-related-link">
                      {labels.requestCorrection}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" prefetch className="legal-related-link">
                      {labels.contact}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          <article className="min-w-0 space-y-5">
            {document.sections.map((section, index) => (
              <section
                id={section.id}
                key={section.id}
                className="legal-section card-surface scroll-mt-28 p-6 sm:p-8"
              >
                <div className="mb-5 flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/35 bg-white/10 text-sm font-bold text-red-200 backdrop-blur-md">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="section-title pt-1 text-xl sm:text-2xl">{section.title.replace(/^\d+\.\s*/, "")}</h2>
                </div>
                <div className="space-y-4">{renderSectionBody(section)}</div>
              </section>
            ))}
          </article>
        </div>

        <div className="legal-footer-card mt-10 card-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/50">
            {labels.relatedDocuments}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={otherDoc.href} prefetch className="legal-footer-pill">
              {otherDoc.label}
            </Link>
            <Link href="/corrections" prefetch className="legal-footer-pill">
              {labels.requestCorrection}
            </Link>
            <Link href="/contact" prefetch className="legal-footer-pill">
              {labels.contact}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
