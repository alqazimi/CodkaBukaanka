import { ensureHttpsUrl, getServerApiUrl } from "./env";

/** Backend origin without trailing slash or a duplicate `/api` suffix. */
export function getBackendOrigin(): string {
  return ensureHttpsUrl(getServerApiUrl()).replace(/\/+$/, "").replace(/\/api$/i, "");
}

/** Build an absolute backend URL for paths like `/api/contact` or `api/admin/inbox`. */
export function buildBackendApiUrl(path: string): string {
  const trimmed = path.startsWith("/") ? path.slice(1) : path;
  const apiPath = trimmed.startsWith("api/") ? trimmed : `api/${trimmed}`;
  return `${getBackendOrigin()}/${apiPath}`;
}
