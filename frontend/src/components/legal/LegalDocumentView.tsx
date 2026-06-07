import type { ReactNode } from "react";
import type { LegalContentSection, LegalDocumentContent } from "@/content/legal/types";

function renderSection(section: LegalContentSection, depth = 0) {
  const Heading = depth === 0 ? "h2" : "h3";

  return (
    <section key={section.id} className={depth === 0 ? "mt-8" : "mt-6"}>
      <Heading>{section.title}</Heading>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
      ))}
      {section.listItems && section.listItems.length > 0 && (
        <ul>
          {section.listItems.map((item) => (
            <li key={item.slice(0, 48)}>{item}</li>
          ))}
        </ul>
      )}
      {section.orderedListItems && section.orderedListItems.length > 0 && (
        <ol>
          {section.orderedListItems.map((item) => (
            <li key={item.slice(0, 48)}>{item}</li>
          ))}
        </ol>
      )}
      {section.subsections?.map((subsection) => renderSection(subsection, depth + 1))}
    </section>
  );
}

export function LegalDocumentView({
  document,
  footer,
}: {
  document: LegalDocumentContent;
  footer?: ReactNode;
}) {
  return (
    <div className="page-container-narrow prose-archive">
      <h1>{document.title}</h1>
      <p className="!mt-2 text-sm text-subtle">
        Last updated: {document.lastUpdated}
      </p>
      <p className="!mt-6">{document.intro}</p>
      {document.sections.map((section) => renderSection(section))}
      {footer && (
        <div className="mt-10 border-t border-white/10 pt-6">{footer}</div>
      )}
    </div>
  );
}
