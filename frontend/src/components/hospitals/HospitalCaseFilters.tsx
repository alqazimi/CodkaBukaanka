"use client";

import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

export function HospitalCaseFilters() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectClass = "input-base !min-h-[44px] !py-2 !text-sm";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4 dark:border-navy-800 dark:bg-navy-900/80">
      <div>
        <label className="mb-1 block text-xs font-medium text-navy-600 dark:text-navy-400">Category</label>
        <select className={selectClass} value={searchParams.get("category") ?? ""} onChange={(e) => updateParams({ category: e.target.value || null })}>
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c][locale === "so" ? "so" : "en"]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-navy-600 dark:text-navy-400">From</label>
        <input type="date" className={selectClass} value={searchParams.get("dateFrom") ?? ""} onChange={(e) => updateParams({ dateFrom: e.target.value || null })} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-navy-600 dark:text-navy-400">To</label>
        <input type="date" className={selectClass} value={searchParams.get("dateTo") ?? ""} onChange={(e) => updateParams({ dateTo: e.target.value || null })} />
      </div>
      {(searchParams.get("category") || searchParams.get("dateFrom") || searchParams.get("dateTo")) && (
        <button
          type="button"
          className="rounded-lg border border-navy-300 px-3 py-2 text-sm text-navy-700 transition-colors hover:bg-white dark:border-navy-600 dark:text-navy-200 dark:hover:bg-navy-800"
          onClick={() => router.push(pathname)}
        >
          Clear
        </button>
      )}
    </div>
  );
}
