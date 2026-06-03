import { cookies } from "next/headers";
import { getSiteUrl } from "./env";

type FetchOptions = RequestInit & {
  method?: string;
};

function adminProxyUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${getSiteUrl()}/api/admin-proxy/${normalized}`;
}

/** Server-side admin reads/writes through the authenticated Vercel proxy. */
export async function adminServerFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  if (!cookieHeader) {
    return { data: null, error: "Not signed in. Please log in again." };
  }

  const url = adminProxyUrl(path);
  const method = (options.method ?? "GET").toUpperCase();

  try {
    const res = await fetch(url, {
      ...options,
      method,
      headers: {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) ?? {}),
        cookie: cookieHeader,
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
