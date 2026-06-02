"use client";

import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

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

  return (
    <aside className="card-surface sticky top-24 p-5">
      <h2 className="mb-4 font-serif text-lg font-semibold text-navy-900">{t("filters")}</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy-600">{t("hospital")}</label>
          <select className="input-base" value={searchParams.get("hospital") ?? ""} onChange={(e) => updateParams({ hospital: e.target.value || null })}>
            <option value="">—</option>
            {options.hospitals.map((h) => (
              <option key={h.slug} value={h.slug}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy-600">Patient</label>
          <select className="input-base" value={searchParams.get("patient") ?? searchParams.get("victim") ?? ""} onChange={(e) => updateParams({ patient: e.target.value || null, victim: null })}>
            <option value="">—</option>
            {patients.map((p) => (
              <option key={p.slug} value={p.slug}>{p.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-navy-600">{t("category")}</label>
          <select className="input-base" value={searchParams.get("category") ?? ""} onChange={(e) => updateParams({ category: e.target.value || null })}>
            <option value="">—</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c][locale === "so" ? "so" : "en"]}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-600">{t("dateFrom")}</label>
            <input type="date" className="input-base px-2" value={searchParams.get("dateFrom") ?? ""} onChange={(e) => updateParams({ dateFrom: e.target.value || null })} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-navy-600">{t("dateTo")}</label>
            <input type="date" className="input-base px-2" value={searchParams.get("dateTo") ?? ""} onChange={(e) => updateParams({ dateTo: e.target.value || null })} />
          </div>
        </div>
        <button
          type="button"
          className="w-full rounded-xl border border-navy-200 py-2.5 text-sm font-medium text-navy-700 transition-all duration-200 hover:border-navy-300 hover:bg-navy-50"
          onClick={() => router.push("/search")}
        >
          {t("clear")}
        </button>
      </div>
    </aside>
  );
}
