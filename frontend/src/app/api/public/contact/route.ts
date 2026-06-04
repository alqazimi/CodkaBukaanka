import { ensureHttpsUrl, getServerApiUrl, getSiteUrl } from "@/lib/env";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function backendUrl(path: string): string {
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalized, `${ensureHttpsUrl(getServerApiUrl())}/`).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    let origin: string | undefined;
    try {
      origin = new URL(getSiteUrl()).origin;
    } catch {
      origin = undefined;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (origin) {
      headers.Origin = origin;
      headers.Referer = `${origin}/contact`;
    }
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

    const upstream = await fetch(backendUrl("api/contact"), {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: upstream.headers.get("content-type")
        ? { "content-type": upstream.headers.get("content-type")! }
        : undefined,
    });
  } catch (error) {
    console.error("[public/contact]", error);
    return NextResponse.json({ error: "Cannot reach API. Try again later." }, { status: 502 });
  }
}
