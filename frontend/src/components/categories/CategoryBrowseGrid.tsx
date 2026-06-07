import { cache } from "react";
import { Link } from "@/i18n/routing";
import { serverApi } from "@/lib/api";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import type { CaseCategory } from "@/types/entities";

export type CategoryCountRow = { category: string; _count: number };

export const getCachedCategoryCounts = cache(async () =>
  serverApi.get<CategoryCountRow[]>("/api/cases/categories", { next: { revalidate: 120 } })
);

/** Published categories only — same rule as hospitals (must have at least one public case). */
export function getCategoriesWithCases(counts: CategoryCountRow[] | null | undefined) {
  const countMap = Object.fromEntries((counts ?? []).map((row) => [row.category, row._count]));

  return CATEGORIES.filter((cat) => (countMap[cat] ?? 0) > 0).map((category) => ({
    category,
    count: countMap[category] as number,
  }));
}

type CategoryBrowseGridProps = {
  locale: string;
  counts?: CategoryCountRow[] | null;
  /** When true, hide the whole block if there are no categories with cases. */
  hideWhenEmpty?: boolean;
  className?: string;
  linkClassName?: string;
  showCounts?: boolean;
};

export async function CategoryBrowseGrid({
  locale,
  counts: countsProp,
  hideWhenEmpty = false,
  className = "mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
  linkClassName = "card-interactive min-h-[52px] px-4 py-4 text-base font-semibold text-white",
  showCounts = true,
}: CategoryBrowseGridProps) {
  const counts = countsProp ?? (await getCachedCategoryCounts());
  const items = getCategoriesWithCases(counts);
  const lang = locale === "so" ? "so" : "en";
  const isSo = locale === "so";

  if (items.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <p className="mt-6 text-sm font-medium text-muted">
        {isSo ? "Weli ma jiraan qaybo leh kiis la daabacay." : "No categories with published cases yet."}
      </p>
    );
  }

  return (
    <div className={className}>
      {items.map(({ category, count }) => (
        <Link
          key={category}
          href={`/search?category=${category}`}
          className={
            showCounts
              ? `${linkClassName} flex items-center justify-between gap-3`
              : linkClassName
          }
        >
          <span>{CATEGORY_LABELS[category as CaseCategory][lang]}</span>
          {showCounts && (
            <span className="shrink-0 rounded-full border border-[hsl(0_84%_55%/0.3)] bg-[hsl(0_84%_55%/0.08)] px-3 py-1 text-sm font-semibold text-[hsl(0_90%_75%)]">
              {count} {isSo ? "kiis" : count === 1 ? "case" : "cases"}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
