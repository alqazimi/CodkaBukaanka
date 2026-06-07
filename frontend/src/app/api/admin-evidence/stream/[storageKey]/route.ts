import { auth } from "@/auth";
import { ensureHttpsUrl, getServerApiUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ storageKey: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getBackendAccessToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storageKey } = await context.params;
  if (!storageKey || !/^[\w.-]+$/.test(storageKey)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const upstreamUrl = new URL(
    `api/admin/evidence/stream/${encodeURIComponent(storageKey)}`,
    `${ensureHttpsUrl(getServerApiUrl())}/`
  ).toString();

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "Not found" }, { status: upstream.status === 401 ? 401 : 404 });
    }

    const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=600",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (error) {
    console.error("[admin-evidence/stream]", error);
    return NextResponse.json({ error: "Could not load evidence" }, { status: 502 });
  }
}
