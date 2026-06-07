import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { DoctorGrid } from "@/components/list/DoctorGrid";
import { EntityListSkeleton } from "@/components/list/EntityListSkeleton";
import { Suspense } from "react";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const description =
    locale === "so"
      ? "Raadi dhakhtarada lagu xusay kiisaska badbaadada bukaanka ee Codka Bukaanka."
      : "Browse doctors referenced in verified patient safety cases on Codka Bukaanka.";
  return buildPageMetadata({ title: "Doctors", description, locale, path: "/doctors" });
}

export default async function DoctorsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("doctor");

  return (
    <div className="page-container">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Suspense fallback={<EntityListSkeleton layout="grid" />}>
        <DoctorGrid locale={locale} />
      </Suspense>
    </div>
  );
}
