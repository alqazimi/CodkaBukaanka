import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { HospitalGrid } from "@/components/list/HospitalGrid";
import { EntityListSkeleton } from "@/components/list/EntityListSkeleton";

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
