import { cookies } from "next/headers";
import { ensureHttpsUrl, getServerApiUrl, getSiteUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";
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
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalized, `${ensureHttpsUrl(getServerApiUrl())}/`).toString();
}

function proxyUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalized, `${ensureHttpsUrl(getSiteUrl())}/api/admin-proxy/`).toString();
}

async function buildCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

async function buildUpstreamHeaders(token: string): Promise<Record<string, string>> {
  const siteUrl = getSiteUrl();
  return {
    Authorization: `Bearer ${token}`,
    Origin: siteUrl,
    Referer: `${siteUrl}/admin`,
    "Content-Type": "application/json",
  };
}

async function parseAdminResponse<T>(res: Response, path: string): Promise<AdminServerResult<T>> {
  if (!res.ok) {
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
    message = mapAdminApiError(res.status, message, code);
    console.error(`Admin API error: ${path} — ${message}`);
    return { data: null, error: message, code };
  }

  if (res.status === 204) {
    return { data: undefined as T, error: null };
  }

  return { data: (await res.json()) as T, error: null };
}

async function adminServerFetchDirect<T>(
  path: string,
  options: FetchOptions,
  accessToken: string
): Promise<AdminServerResult<T>> {
  const url = backendUrl(path);
  const method = (options.method ?? "GET").toUpperCase();

  const headers = await buildUpstreamHeaders(accessToken);
  const res = await fetch(url, {
    ...options,
    method,
    headers: {
      ...headers,
      ...((options.headers as Record<string, string>) ?? {}),
    },
    cache: "no-store",
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

/** Server-side admin reads/writes — Railway direct, with same-origin proxy fallback. */
export async function adminServerFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<AdminServerResult<T>> {
  const accessToken = await getBackendAccessToken();
  if (!accessToken) {
    return { data: null, error: "Not signed in. Please log in again." };
  }

  try {
    const direct = await adminServerFetchDirect<T>(path, options, accessToken);
    if (direct.data !== null || direct.error === null) {
      return direct;
    }

    const proxied = await adminServerFetchProxy<T>(path, options);
    if (proxied.data !== null || proxied.error === null) {
      return proxied;
    }

    return direct.error ? direct : proxied;
  } catch (error) {
    console.error(`Admin API unreachable: ${path}`, error);
    try {
      const proxied = await adminServerFetchProxy<T>(path, options);
      if (proxied.data !== null || proxied.error === null) {
        return proxied;
      }
    } catch (proxyError) {
      console.error(`Admin proxy fallback failed: ${path}`, proxyError);
    }

    return {
      data: null,
      error: "Cannot reach admin API. Check API_URL on Vercel and FRONTEND_URL on Railway.",
    };
  }
}

export async function adminServerGet<T>(path: string): Promise<AdminServerResult<T>> {
  return adminServerFetch<T>(path, { method: "GET" });
}
