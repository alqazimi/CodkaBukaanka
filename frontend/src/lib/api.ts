import { getPublicApiUrl, getServerApiUrl } from "./env";

type FetchOptions = RequestInit & {
  token?: string;
  next?: { revalidate?: number | false; tags?: string[] };
};

let cachedDeleteActionToken: { value: string; expiresAt: number } | null = null;

async function getDeleteActionToken(token?: string): Promise<string | null> {
  const now = Date.now();
  if (cachedDeleteActionToken && cachedDeleteActionToken.expiresAt > now) {
    return cachedDeleteActionToken.value;
  }

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(`${getPublicApiUrl()}/api/auth/action-token`, {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string; expiresIn?: number };
    if (!data.token) return null;
    const expiresInMs = Math.max((data.expiresIn ?? 60) * 1000 - 5_000, 5_000);
    cachedDeleteActionToken = { value: data.token, expiresAt: now + expiresInMs };
    return data.token;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options: FetchOptions = {}, server = false): Promise<T> {
  const base = server ? getServerApiUrl() : getPublicApiUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const method = (options.method ?? "GET").toUpperCase();
  const shouldUseDefaultRevalidate =
    server && method === "GET" && !options.token && options.cache === undefined && options.next === undefined;
  const nextConfig = options.next ?? (shouldUseDefaultRevalidate ? { revalidate: 60 } : undefined);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (options.token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${options.token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      next: nextConfig,
      cache: options.cache ?? (nextConfig ? undefined : "no-store"),
    });

    if (!res.ok) {
      if (res.status === 404) return null as T;
      console.error(`API error ${res.status}: ${url}`);
      return null as T;
    }

    return res.json() as Promise<T>;
  } catch (error) {
    console.error(`API unreachable: ${url}`, error);
    return null as T;
  }
}

/** Server-side API calls (SSR, sitemap) */
export const serverApi = {
  get: <T>(path: string, options?: Omit<FetchOptions, "method">) =>
    apiFetch<T>(path, { ...options, method: "GET" }, true),

  post: <T>(path: string, body: unknown, options?: Omit<FetchOptions, "method">) =>
    apiFetch<T>(path, { ...options, method: "POST", body: JSON.stringify(body) }, true),
};

/** Client-side API calls (browser) */
export const clientApi = {
  get: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: "GET", token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body), token }),

  delete: async <T>(path: string, token?: string) => {
    const actionToken = await getDeleteActionToken(token);
    const headers = actionToken ? { "x-admin-action-token": actionToken } : undefined;
    return apiFetch<T>(path, { method: "DELETE", token, headers });
  },

  upload: async (file: File, token?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${getPublicApiUrl()}/api/admin/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },
};

export function getApiBaseUrl() {
  return getPublicApiUrl();
}

/** Unwrap paginated API responses `{ items, total, ... }` or legacy arrays */
export function unwrapList<T>(data: { items?: T[] } | T[] | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
