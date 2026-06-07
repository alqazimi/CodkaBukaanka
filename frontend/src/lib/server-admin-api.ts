import { cookies } from "next/headers";
import { buildBackendApiUrl } from "@/lib/backend-url";
import { ensureHttpsUrl, getSiteUrl } from "@/lib/env";
import { getCachedAccessToken } from "@/lib/cached-admin-auth";
import { mapAdminApiError } from "@/lib/login-error-message";

type FetchOptions = RequestInit & {
  method?: string;
};

export type AdminServerResult<T> = {
  data: T | null;
  error: string | null;
  code?: string;
};

function backendUrl(path: string): string {
  return buildBackendApiUrl(path);
}

/** Base URL for server-side calls to the same Next.js app (admin proxy). */
function internalProxyBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.AUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}` : undefined,
  ];

  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    try {
      return ensureHttpsUrl(raw.trim()).replace(/\/$/, "");
    } catch {
      // try next
    }
  }

  return ensureHttpsUrl(getSiteUrl()).replace(/\/$/, "");
}

function proxyUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${internalProxyBaseUrl()}/api/admin-proxy/${normalized}`;
}

async function buildCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

async function buildUpstreamHeaders(token: string, method: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  const upper = method.toUpperCase();
  if (upper !== "GET" && upper !== "HEAD") {
    const siteUrl = internalProxyBaseUrl();
    headers.Origin = siteUrl;
    headers.Referer = `${siteUrl}/admin`;
  }
  return headers;
}

async function parseAdminResponse<T>(res: Response, path: string): Promise<AdminServerResult<T>> {
  if (!res.ok) {
    if (res.status === 401) {
      return {
        data: null,
        error: "Your session expired. Please sign in again.",
        code: "session_expired",
      };
    }
    if (res.status === 404) {
      return { data: null, error: null };
    }
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const body = (await res.json()) as { error?: string; message?: string; code?: string };
      if (typeof body.code === "string") code = body.code;
      if (typeof body.error === "string" && body.error) message = body.error;
      else if (typeof body.message === "string" && body.message) message = body.message;
    } catch {
      // ignore non-JSON bodies
    }
    if (res.status === 403 && message.trim() === "Forbidden" && code !== "invalid_admin_role") {
      code = "admin_access_denied";
    }
    message = mapAdminApiError(res.status, message, code);
    console.error(`Admin API error: ${path} — ${message}`);
    return { data: null, error: message, code };
  }

  if (res.status === 204) {
    return { data: undefined as T, error: null };
  }

  return { data: (await res.json()) as T, error: null };
}

const DIRECT_FETCH_TIMEOUT_MS = 5_000;

async function adminServerFetchDirect<T>(
  path: string,
  options: FetchOptions,
  accessToken: string
): Promise<AdminServerResult<T>> {
  const url = backendUrl(path);
  const method = (options.method ?? "GET").toUpperCase();

  const headers = await buildUpstreamHeaders(accessToken, method);
  const res = await fetch(url, {
    ...options,
    method,
    headers: {
      ...headers,
      ...((options.headers as Record<string, string>) ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(DIRECT_FETCH_TIMEOUT_MS),
  });

  return parseAdminResponse<T>(res, path);
}

async function adminServerFetchProxy<T>(path: string, options: FetchOptions): Promise<AdminServerResult<T>> {
  const url = proxyUrl(path);
  const method = (options.method ?? "GET").toUpperCase();
  const cookieHeader = await buildCookieHeader();
  if (!cookieHeader) {
    return { data: null, error: "Not signed in. Please log in again." };
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers: {
      Cookie: cookieHeader,
      ...((options.headers as Record<string, string>) ?? {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });

  return parseAdminResponse<T>(res, path);
}

function shouldReturnEarly(result: AdminServerResult<unknown>): boolean {
  if (result.error === null) return true;
  if (result.data !== null) return true;
  if (result.code === "session_expired" || result.code === "invalid_admin_role") return true;
  if (result.code === "admin_access_denied") return true;
  if (result.code === "mfa_setup_required") return true;
  if (result.error?.includes("Not signed in")) return true;
  if (result.error?.includes("MFA setup") || result.error?.includes("Authenticator")) return true;
  if (result.error?.includes("valid admin role")) return true;
  if (result.error?.trim() === "Forbidden") return true;
  return false;
}

/** Server-side admin reads/writes — direct Railway first, proxy fallback. */
export async function adminServerFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<AdminServerResult<T>> {
  const accessToken = await getCachedAccessToken();
  if (!accessToken) {
    return { data: null, error: "Not signed in. Please log in again." };
  }

  // Prefer direct Railway with Bearer token (one hop). Proxy is fallback only.
  const attempts: Array<() => Promise<AdminServerResult<T>>> = [
    () => adminServerFetchDirect<T>(path, options, accessToken),
    () => adminServerFetchProxy<T>(path, options),
  ];

  let lastResult: AdminServerResult<T> = { data: null, error: "Request failed" };

  for (const attempt of attempts) {
    try {
      const result = await attempt();
      if (shouldReturnEarly(result)) {
        return result;
      }
      lastResult = result;
    } catch (error) {
      console.error(`Admin API attempt failed: ${path}`, error);
    }
  }

  return {
    data: null,
    error:
      lastResult.error && lastResult.error !== "Request failed"
        ? lastResult.error
        : "Cannot reach admin API. Check API_URL on Vercel and FRONTEND_URL on Railway.",
    code: lastResult.code ?? "api_unreachable",
  };
}

export async function adminServerGet<T>(path: string): Promise<AdminServerResult<T>> {
  return adminServerFetch<T>(path, { method: "GET" });
}
