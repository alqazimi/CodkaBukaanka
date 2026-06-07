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
  const hospitals = options.hospitals ?? [];
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
      <p className="text-sm leading-relaxed text-white/65 xl:hidden">{t("filtersHelp")}</p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-white/85">{t("hospital")}</label>
        <select
          className="input-base min-h-[44px] text-base sm:text-sm"
          value={searchParams.get("hospital") ?? ""}
          onChange={(e) => updateParams({ hospital: e.target.value || null })}
        >
          <option value="">—</option>
          {hospitals.map((h) => (
            <option key={h.slug} value={h.slug}>
              {h.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-white/85">{t("patient")}</label>
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
        <label className="mb-1.5 block text-sm font-medium text-white/85">{t("category")}</label>
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
          <label className="mb-1.5 block text-sm font-medium text-white/85">{t("dateFrom")}</label>
          <input
            type="date"
            className="input-base min-h-[44px] px-2 text-base sm:text-sm"
            value={searchParams.get("dateFrom") ?? ""}
            onChange={(e) => updateParams({ dateFrom: e.target.value || null })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/85">{t("dateTo")}</label>
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
        className="min-h-[44px] w-full rounded-xl border border-white/15 py-2.5 text-sm font-medium text-white/85 transition-all duration-200 hover:border-white/25 hover:bg-white/10"
        onClick={() => router.push("/search")}
      >
        {t("clear")}
      </button>
    </div>
  );

  return (
    <>
      <details className="card-surface group xl:hidden">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-2 p-5 font-serif text-lg font-semibold text-white [&::-webkit-details-marker]:hidden">
          <span>{t("filtersOptional")}</span>
          <ChevronDown className="h-5 w-5 shrink-0 text-white/60 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="border-t border-white/10 px-5 pb-5 pt-2">{fields}</div>
      </details>
      <aside className="card-surface sticky top-24 hidden p-5 xl:block">
        <h2 className="mb-1 font-serif text-lg font-semibold text-white">{t("filtersOptional")}</h2>
        <p className="mb-4 text-xs leading-relaxed text-white/65">{t("filtersHelp")}</p>
        {fields}
      </aside>
    </>
  );
}
