import type { Metadata } from "next";
import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import type { LegalDocumentContent } from "@/content/legal/types";

export function createLegalMetadata(document: LegalDocumentContent) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    await params;
    return {
      title: document.title,
      description: document.intro.slice(0, 160),
    };
  };
}

export function createLegalPage(document: LegalDocumentContent, footer?: ReactNode) {
  return async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    return <LegalDocumentView document={document} footer={footer} />;
  };
}
