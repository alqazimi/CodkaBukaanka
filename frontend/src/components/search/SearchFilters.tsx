"use client";

import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { ChevronDown } from "lucide-react";

type FilterOptions = {
  hospitals: { slug: string; name: string }[];
  patients?: { slug: string; fullName: string }[];
  victims?: { slug: string; fullName: string }[];
};

export function SearchFilters({ options }: { options: FilterOptions }) {
  const t = useTranslations("search");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const patients = options.patients ?? options.victims ?? [];

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  const fields = (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-navy-600 dark:text-navy-400 lg:hidden">{t("filtersHelp")}</p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">{t("hospital")}</label>
        <select
          className="input-base min-h-[44px] text-base sm:text-sm"
          value={searchParams.get("hospital") ?? ""}
          onChange={(e) => updateParams({ hospital: e.target.value || null })}
        >
          <option value="">—</option>
          {options.hospitals.map((h) => (
            <option key={h.slug} value={h.slug}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">{t("patient")}</label>
        <select
          className="input-base min-h-[44px] text-base sm:text-sm"
          value={searchParams.get("patient") ?? searchParams.get("victim") ?? ""}
          onChange={(e) => updateParams({ patient: e.target.value || null, victim: null })}
        >
          <option value="">—</option>
          {patients.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.fullName}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">{t("category")}</label>
        <select
          className="input-base min-h-[44px] text-base sm:text-sm"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => updateParams({ category: e.target.value || null })}
        >
          <option value="">—</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c][locale === "so" ? "so" : "en"]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">{t("dateFrom")}</label>
          <input
            type="date"
            className="input-base min-h-[44px] px-2 text-base sm:text-sm"
            value={searchParams.get("dateFrom") ?? ""}
            onChange={(e) => updateParams({ dateFrom: e.target.value || null })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy-700 dark:text-navy-300">{t("dateTo")}</label>
          <input
            type="date"
            className="input-base min-h-[44px] px-2 text-base sm:text-sm"
            value={searchParams.get("dateTo") ?? ""}
            onChange={(e) => updateParams({ dateTo: e.target.value || null })}
          />
        </div>
      </div>
      <button
        type="button"
        className="min-h-[44px] w-full rounded-xl border border-navy-200 py-2.5 text-sm font-medium text-navy-700 transition-all duration-200 hover:border-navy-300 hover:bg-navy-50 dark:border-navy-600 dark:text-navy-200 dark:hover:bg-navy-800"
        onClick={() => router.push("/search")}
      >
        {t("clear")}
      </button>
    </div>
  );

  return (
    <>
      <details className="card-surface group lg:hidden">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-2 p-5 font-serif text-lg font-semibold text-navy-900 dark:text-navy-100 [&::-webkit-details-marker]:hidden">
          <span>{t("filtersOptional")}</span>
          <ChevronDown className="h-5 w-5 shrink-0 text-navy-500 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="border-t border-navy-100 px-5 pb-5 pt-2 dark:border-navy-800">{fields}</div>
      </details>
      <aside className="card-surface sticky top-24 hidden p-5 lg:block">
        <h2 className="mb-1 font-serif text-lg font-semibold text-navy-900 dark:text-navy-100">{t("filtersOptional")}</h2>
        <p className="mb-4 text-xs leading-relaxed text-navy-500 dark:text-navy-400">{t("filtersHelp")}</p>
        {fields}
      </aside>
    </>
  );
}
