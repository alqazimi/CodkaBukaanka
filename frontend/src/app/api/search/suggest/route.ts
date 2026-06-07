import { buildBackendApiUrl } from "@/lib/backend-url";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const upstream = await fetch(`${buildBackendApiUrl("/api/search/suggest")}?q=${encodeURIComponent(q)}`, {
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
