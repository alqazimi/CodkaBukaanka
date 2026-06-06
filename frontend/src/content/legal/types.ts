export type LegalContentSection = {
  id: string;
  title: string;
  paragraphs: string[];
  listItems?: string[];
  orderedListItems?: string[];
  subsections?: LegalContentSection[];
};

export type LegalDocumentContent = {
  id: string;
  slug: string;
  path: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalContentSection[];
};
