import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import type { LegalDocumentContent } from "@/content/legal/types";
import { buildPageMetadata } from "@/lib/seo";

export function createLegalMetadata(document: LegalDocumentContent) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    return buildPageMetadata({
      title: document.title,
      description: document.intro.slice(0, 160),
      locale,
      path: document.path,
    });
  };
}

export function createLegalPage(document: LegalDocumentContent) {
  return async function LegalPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("legalDoc");

    return (
      <LegalDocumentView
        document={document}
        labels={{
          lastUpdated: t("lastUpdated"),
          onThisPage: t("onThisPage"),
          relatedDocuments: t("relatedDocuments"),
          privacyPolicy: t("privacyPolicy"),
          termsOfUse: t("termsOfUse"),
          requestCorrection: t("requestCorrection"),
          contact: t("contact"),
          documentBadge: t("documentBadge"),
        }}
      />
    );
  };
}
