import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { serverApi } from "@/lib/api";

export default async function CategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const lang = locale === "so" ? "so" : "en";

  const counts = await serverApi.get<{ category: string; _count: number }[]>(
    "/api/cases/categories",
    { next: { revalidate: 120 } }
  );
  const countMap = Object.fromEntries((counts ?? []).map((c) => [c.category, c._count]));

  return (
    <div className="page-container">
      <h1 className="font-serif text-3xl font-bold text-white">{t("categoriesTitle")}</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/search?category=${cat}`}
            className="card-interactive flex items-center justify-between px-6 py-4"
          >
            <span className="font-medium text-white">{CATEGORY_LABELS[cat][lang]}</span>
            <span className="rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-sm font-medium text-teal-200">
              {countMap[cat] ?? 0}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
