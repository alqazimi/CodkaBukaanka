import { ensureHttpsUrl, getPublicApiUrl, getServerApiUrl } from "./env";
import { notifyAdminSessionExpired } from "./admin-session-expired";
import { mapAdminApiError } from "./login-error-message";
import { logger } from "./logger";

function toAdminRouterPath(apiPath: string): string {
  const normalized = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  if (normalized.startsWith("/api/admin")) {
    const trimmed = normalized.slice("/api/admin".length);
    return trimmed.length > 0 ? trimmed : "/";
  }
  return normalized;
}

const actionTokenCache = new Map<string, { value: string; expiresAt: number }>();

function apiUrl(base: string, path: string): string {
  const normalized = ensureHttpsUrl(base);
  return new URL(path.startsWith("/") ? path : `/${path}`, `${normalized}/`).toString();
}

const ADMIN_PROXY = "/api/admin-proxy";

function adminProxyPath(apiPath: string): string {
  const normalized = apiPath.startsWith("/") ? apiPath.slice(1) : apiPath;
  return `${ADMIN_PROXY}/${normalized}`;
}

type FetchOptions = RequestInit & {
  token?: string;
  next?: { revalidate?: number | false; tags?: string[] };
};

let lastApiError: string | null = null;

/** Message from the most recent failed clientApi call (if any). */
export function getLastApiError(): string | null {
  return lastApiError;
}

async function getDestructiveActionToken(method: string, apiPath: string): Promise<string | null> {
  const routerPath = toAdminRouterPath(apiPath);
  const cacheKey = `${method}:${routerPath}`;
  const now = Date.now();
  const cached = actionTokenCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  try {
    const qs = new URLSearchParams({ method, path: routerPath });
    const res = await fetch(`${adminProxyPath(`api/auth/action-token`)}?${qs.toString()}`, {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { token?: string; expiresIn?: number };
    if (!data.token) return null;
    const expiresInMs = Math.max((data.expiresIn ?? 60) * 1000 - 5_000, 5_000);
    actionTokenCache.set(cacheKey, { value: data.token, expiresAt: now + expiresInMs });
    return data.token;
  } catch {
    return null;
  }
}

async function apiFetch<T>(path: string, options: FetchOptions = {}, server = false): Promise<T> {
  const base = server ? getServerApiUrl() : getPublicApiUrl();
  const url = apiUrl(base, path);
  const method = (options.method ?? "GET").toUpperCase();
  const shouldUseDefaultRevalidate =
    server && method === "GET" && !options.token && options.cache === undefined && options.next === undefined;
  const nextConfig = options.next ?? (shouldUseDefaultRevalidate ? { revalidate: 300 } : undefined);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
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
      if (res.status === 404) {
        lastApiError = null;
        return null as T;
      }
      let message = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string; message?: string };
        if (typeof body.error === "string" && body.error) message = body.error;
        else if (typeof body.message === "string" && body.message) message = body.message;
      } catch {
        // ignore non-JSON error bodies
      }
      lastApiError = message;
      logger.error(`API error ${res.status}: ${url}`);
      return null as T;
    }

    lastApiError = null;
    return res.json() as Promise<T>;
  } catch (error) {
    lastApiError = "Cannot reach API server. Check that the backend is running and API_URL is correct.";
    logger.error(`API unreachable: ${url}`, error);
    return null as T;
  }
}

async function clientProxyFetch<T>(apiPath: string, options: RequestInit = {}): Promise<T> {
  const url = adminProxyPath(apiPath);
  const method = (options.method ?? "GET").toUpperCase();

  try {
    const res = await fetch(url, {
      ...options,
      method,
      credentials: "same-origin",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: {
        ...((options.headers as Record<string, string>) ?? {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        lastApiError = null;
        return null as T;
      }
      let message = `Request failed (${res.status})`;
      let code: string | undefined;
      try {
        const body = (await res.json()) as { error?: string; message?: string; code?: string };
        if (typeof body.code === "string") code = body.code;
        if (typeof body.error === "string" && body.error) message = body.error;
        else if (typeof body.message === "string" && body.message) message = body.message;
      } catch {
        // ignore
      }
      if (res.status === 401) {
        notifyAdminSessionExpired();
      }
      lastApiError = mapAdminApiError(res.status, message, code);
      return null as T;
    }

    lastApiError = null;
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  } catch {
    lastApiError =
      process.env.NODE_ENV === "production"
        ? "Cannot reach admin API. Check API_URL on Vercel (Railway URL) and FRONTEND_URL on Railway (your Vercel site URL)."
        : "Cannot reach admin API. Start the backend with: cd backend && npm run dev (port 4000).";
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

/** Client-side admin API calls — proxied through Next.js (no token in browser). */
export const clientApi = {
  get: <T>(path: string) => clientProxyFetch<T>(path, { method: "GET" }),

  post: <T>(path: string, body: unknown) =>
    clientProxyFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),

  /** POST that requires a short-lived destructive-action token (e.g. recycle bin restore). */
  postDestructive: async <T>(path: string, body: unknown) => {
    const actionToken = await getDestructiveActionToken("POST", path);
    const headers = actionToken ? { "x-admin-action-token": actionToken } : undefined;
    return clientProxyFetch<T>(path, { method: "POST", body: JSON.stringify(body), headers });
  },

  patch: <T>(path: string, body: unknown) =>
    clientProxyFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: async <T>(path: string) => {
    const actionToken = await getDestructiveActionToken("DELETE", path);
    const headers = actionToken ? { "x-admin-action-token": actionToken } : undefined;
    return clientProxyFetch<T>(path, { method: "DELETE", headers });
  },

  upload: async (file: File, visibility: "PUBLIC" | "PRIVATE" = "PRIVATE") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visibility", visibility);
    const res = await fetch(`${ADMIN_PROXY}/upload`, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      code?: string;
      url?: string;
      publicId?: string;
      mimeType?: string;
      bytes?: number;
      type?: string;
      visibility?: string;
      fileName?: string;
      fileSize?: number;
    };
    if (!res.ok) {
      const detail = mapAdminApiError(
        res.status,
        (typeof body.error === "string" && body.error) ||
          (typeof body.message === "string" && body.message) ||
          null,
        typeof body.code === "string" ? body.code : undefined
      );
      throw new Error(detail);
    }
    return body;
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
