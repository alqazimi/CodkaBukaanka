import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { MedicationGrid } from "@/components/list/MedicationGrid";
import { EntityListSkeleton } from "@/components/list/EntityListSkeleton";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const description =
    locale === "so"
      ? "Raadi daawooyinka ku lug leh kiisaska badbaadada bukaanka ee Codka Bukaanka."
      : "Browse medications involved in verified patient safety cases on Codka Bukaanka.";
  return buildPageMetadata({ title: "Medications", description, locale, path: "/medications" });
}

export default async function MedicationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("medication");

  return (
    <div className="page-container">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={<EntityListSkeleton layout="grid" />}>
        <MedicationGrid locale={locale} />
      </Suspense>
    </div>
  );
}
