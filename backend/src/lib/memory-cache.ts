const store = new Map<string, { expiresAt: number; value: unknown }>();

/** Short-lived in-process cache — speeds repeated admin dashboard reads on the same instance. */
export async function withMemoryCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T;
  }
  const value = await loader();
  store.set(key, { expiresAt: Date.now() + ttlMs, value });
  return value;
}

export function invalidateMemoryCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Clear cached admin/public aggregates after data changes. */
export function invalidateAppCaches(): void {
  invalidateMemoryCache("admin-analytics");
  invalidateMemoryCache("risk-analysis");
  invalidateMemoryCache("public-stats");
}
