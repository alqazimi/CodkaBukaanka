import { ensureHttpsUrl, getServerApiUrl } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalized, `${ensureHttpsUrl(getServerApiUrl())}/`).toString();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const upstream = await fetch(backendUrl(`api/search/suggest?q=${encodeURIComponent(q)}`), {
      next: { revalidate: 60 },
    });
    if (!upstream.ok) {
      return NextResponse.json([], { status: upstream.status });
    }
    const data = await upstream.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("[search/suggest]", error);
    return NextResponse.json([], { status: 502 });
  }
}
