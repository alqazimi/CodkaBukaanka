import { ensureHttpsUrl } from "./env";

export type BackendHealthProbe = {
  api: "ok" | "degraded" | "unconfigured";
  apiHost?: string;
  httpStatus?: number;
};

/** Try each configured API base URL until one responds (handles wrong API_URL on Vercel). */
export async function probeBackendHealth(timeoutMs = 8000): Promise<BackendHealthProbe> {
  const candidates = [process.env.API_URL, process.env.NEXT_PUBLIC_API_URL]
    .filter((v): v is string => Boolean(v?.trim()))
    .map((v) => ensureHttpsUrl(v))
    .filter((v, i, arr) => arr.indexOf(v) === i);

  if (!candidates.length) {
    return { api: "unconfigured" };
  }

  let lastHost = new URL(candidates[0]).hostname;
  let lastStatus: number | undefined;

  for (const base of candidates) {
    lastHost = new URL(base).hostname;
    try {
      const res = await fetch(new URL("/health", base), {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
      });
      lastStatus = res.status;
      if (res.ok) {
        return { api: "ok", apiHost: lastHost, httpStatus: res.status };
      }
    } catch {
      /* try next candidate */
    }
  }

  return { api: "degraded", apiHost: lastHost, httpStatus: lastStatus };
}
