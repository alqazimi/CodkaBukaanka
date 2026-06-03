import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/env";

/** Forward browser context to the Railway login API (NextAuth runs server-side on Vercel). */
export async function buildLoginProxyHeaders(): Promise<Record<string, string>> {
  const requestHeaders = await headers();
  const siteUrl = getSiteUrl();
  const clientIp =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "";
  const userAgent = requestHeaders.get("user-agent")?.trim() || "";
  const origin = requestHeaders.get("origin")?.trim() || siteUrl;
  const referer = requestHeaders.get("referer")?.trim() || `${siteUrl}/admin/login`;

  const out: Record<string, string> = {
    "Content-Type": "application/json",
    Origin: origin,
    Referer: referer,
  };
  if (clientIp) out["X-Forwarded-For"] = clientIp;
  if (userAgent) out["User-Agent"] = userAgent;
  return out;
}
