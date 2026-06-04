import { isAllowedEvidenceMediaUrl } from "@/lib/evidence-display-url";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src || !isAllowedEvidenceMediaUrl(src)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const upstream = await fetch(src, {
      cache: "no-store",
      headers: { Accept: "image/*,video/*,application/octet-stream" },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: upstream.status === 404 ? "File not found on server" : "Upstream error" },
        { status: upstream.status === 404 ? 404 : 502 }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        "Cross-Origin-Resource-Policy": "cross-origin",
      },
    });
  } catch (error) {
    console.error("[evidence-media]", error);
    return NextResponse.json({ error: "Could not fetch media" }, { status: 502 });
  }
}
