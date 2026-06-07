import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryBrowseGrid, getCachedCategoryCounts, getCategoriesWithCases } from "@/components/categories/CategoryBrowseGrid";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const description =
    locale === "so"
      ? "Raadi kiisaska badbaadada bukaanka qayb ahaan — khaladaad daawo, cudur-sheegid, iyo wax kale."
      : "Browse verified patient safety cases by category on Codka Bukaanka.";
  return buildPageMetadata({ title: t("categoriesTitle"), description, locale, path: "/categories" });
}

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const isSo = locale === "so";
  const categoryCounts = await getCachedCategoryCounts();
  const categoriesWithCases = getCategoriesWithCases(categoryCounts);

  return (
    <div className="page-container">
      <PageHeader title={t("categoriesTitle")} description={t("categoriesSubtitle")} />
      {categoriesWithCases.length > 0 ? (
        <CategoryBrowseGrid
          locale={locale}
          counts={categoryCounts}
          className="mt-8 grid gap-4 sm:grid-cols-2"
          linkClassName="card-interactive px-6 py-4 text-base font-semibold text-white"
        />
      ) : (
        <p className="mt-8 text-sm font-medium text-muted">
          {isSo ? "Weli ma jiraan qaybo leh kiis la daabacay." : "No categories with published cases yet."}
        </p>
      )}
    </div>
  );
}
