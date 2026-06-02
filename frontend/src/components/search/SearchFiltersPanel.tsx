"use client";

import { Suspense } from "react";
import { SearchFilters } from "./SearchFilters";

type FilterOptions = {
  hospitals: { slug: string; name: string }[];
  patients?: { slug: string; fullName: string }[];
};

export function SearchFiltersPanel({ options }: { options: FilterOptions }) {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-navy-100" />}>
      <SearchFilters options={options} />
    </Suspense>
  );
}
