"use client";

import { Suspense } from "react";
import { SearchFilters } from "./SearchFilters";

type FilterOptions = {
  hospitals: { slug: string; name: string }[];
  patients?: { slug: string; fullName: string }[];
};

export function SearchFiltersPanel({ options }: { options: FilterOptions }) {
  return (
    <Suspense fallback={<div className="skeleton h-64" />}>
      <SearchFilters options={options} />
    </Suspense>
  );
}
