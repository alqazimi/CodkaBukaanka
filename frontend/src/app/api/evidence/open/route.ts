import { NextRequest, NextResponse } from "next/server";
import { resolveEvidenceOpenTarget } from "@/lib/evidence-open";

function collectAllowedHosts(): Set<string> {
  const hosts = new Set<string>(["res.cloudinary.com"]);
  for (const key of ["NEXT_PUBLIC_API_URL", "API_URL"] as const) {
    const raw = process.env[key]?.trim();
    if (!raw) continue;
    try {
      const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
      hosts.add(new URL(normalized).hostname);
    } catch {
      // ignore
    }
  }
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railway) {
    try {
      hosts.add(new URL(railway.startsWith("http") ? railway : `https://${railway}`).hostname);
    } catch {
      // ignore
    }
  }
  return hosts;
}

function isAllowedHost(hostname: string, allowed: Set<string>): boolean {
  return [...allowed].some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "HTTPS required" }, { status: 400 });
  }
  if (isDev && parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  const allowed = collectAllowedHosts();
  if (!isAllowedHost(parsed.hostname, allowed)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const target = resolveEvidenceOpenTarget(raw);
  if (!target) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  return NextResponse.redirect(target, 302);
}
