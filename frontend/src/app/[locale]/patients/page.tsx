import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { PatientGrid } from "@/components/list/PatientGrid";
import { EntityListSkeleton } from "@/components/list/EntityListSkeleton";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "patient" });
  const description =
    locale === "so"
      ? "Raadi bukaannada iyo kiisaskooda ee kaydka Codka Bukaanka."
      : "Browse patients and verified healthcare incident records on Codka Bukaanka.";
  return buildPageMetadata({ title: t("title"), description, locale, path: "/patients" });
}

export default async function PatientsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("patient");
  const isSo = locale === "so";

  return (
    <div className="page-container">
      <PageHeader
        title={t("title")}
        description={
          isSo
            ? "Bukaannada lagu xusay kiisaska caafimaad ee la xaqiijiyay."
            : "Patients referenced in verified medical incident records."
        }
      />
      <Suspense fallback={<EntityListSkeleton layout="grid" />}>
        <PatientGrid locale={locale} />
      </Suspense>
    </div>
  );
}
