import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { serverApi } from "@/lib/api";

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const counts = await serverApi.get<{ category: string; _count: number }[]>(
    "/api/cases/categories",
    { next: { revalidate: 120 } }
  );
  const countMap = Object.fromEntries((counts ?? []).map((c) => [c.category, c._count]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-bold text-navy-900">{t("categoriesTitle")}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/search?category=${cat}`}
            className="flex items-center justify-between rounded-xl border border-navy-100 bg-white px-6 py-4 hover:border-teal-300"
          >
            <span className="font-medium text-navy-900">
              {CATEGORY_LABELS[cat][locale === "so" ? "so" : "en"]}
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
              {countMap[cat] ?? 0}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
