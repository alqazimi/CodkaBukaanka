import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { HospitalGrid } from "@/components/list/HospitalGrid";
import { EntityListSkeleton } from "@/components/list/EntityListSkeleton";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hospital" });
  const description =
    locale === "so"
      ? "Raadi isbitaalada lagu xusay kiisaska badbaadada bukaanka ee Codka Bukaanka."
      : "Browse hospitals referenced in verified patient safety cases on Codka Bukaanka.";
  return buildPageMetadata({ title: t("title"), description, locale, path: "/hospitals" });
}

export default async function HospitalsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("hospital");
  const isSo = locale === "so";

  return (
    <div className="page-container">
      <PageHeader
        title={t("title")}
        description={
          isSo
            ? "Isbitaalada lagu xusay kiisaska caafimaad ee la xaqiijiyay."
            : "Hospitals referenced in verified medical incident records."
        }
      />
      <Suspense fallback={<EntityListSkeleton layout="grid" />}>
        <HospitalGrid locale={locale} />
      </Suspense>
    </div>
  );
}
