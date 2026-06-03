import { ensureHttpsUrl, getServerApiUrl, getSiteUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";

type FetchOptions = RequestInit & {
  method?: string;
};

function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalized, `${ensureHttpsUrl(getServerApiUrl())}/`).toString();
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

/** Server-side admin reads/writes — call Railway directly with the session JWT. */
export async function adminServerFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const accessToken = await getBackendAccessToken();
  if (!accessToken) {
    return { data: null, error: "Not signed in. Please log in again." };
  }

  const url = backendUrl(path);
  const method = (options.method ?? "GET").toUpperCase();

  try {
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

    if (!res.ok) {
      if (res.status === 404) {
        return { data: null, error: null };
      }
      let message = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as { error?: string; message?: string };
        if (typeof body.error === "string" && body.error) message = body.error;
        else if (typeof body.message === "string" && body.message) message = body.message;
      } catch {
        // ignore non-JSON bodies
      }
      console.error(`Admin API error: ${path} — ${message}`);
      return { data: null, error: message };
    }

    if (res.status === 204) {
      return { data: undefined as T, error: null };
    }

    return { data: (await res.json()) as T, error: null };
  } catch (error) {
    console.error(`Admin API unreachable: ${path}`, error);
    return {
      data: null,
      error: "Cannot reach admin API. Check API_URL on Vercel and FRONTEND_URL on Railway.",
    };
  }
}

export async function adminServerGet<T>(path: string): Promise<{ data: T | null; error: string | null }> {
  return adminServerFetch<T>(path, { method: "GET" });
}
