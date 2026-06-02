"use client";

import { useCallback, useEffect, useState } from "react";

export function useAdminListState<T extends { id: string }>(
  initial: T[],
  sort?: (a: T, b: T) => number
) {
  const [items, setItems] = useState(initial);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  const applySort = useCallback(
    (next: T[]) => (sort ? [...next].sort(sort) : next),
    [sort]
  );

  const add = useCallback(
    (item: T) => setItems((prev) => applySort([...prev, item])),
    [applySort]
  );

  const update = useCallback(
    (item: T) => setItems((prev) => applySort(prev.map((x) => (x.id === item.id ? item : x)))),
    [applySort]
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { items, add, update, remove };
}

export function sortByName<T extends { name?: string | null; fullName?: string | null }>(a: T, b: T) {
  const left = (a.name ?? a.fullName ?? "").toLowerCase();
  const right = (b.name ?? b.fullName ?? "").toLowerCase();
  return left.localeCompare(right);
}
