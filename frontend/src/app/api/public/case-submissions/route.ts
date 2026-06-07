import { NextRequest, NextResponse } from "next/server";
import { buildBackendApiUrl } from "@/lib/backend-url";
import { getSiteUrl } from "@/lib/env";

export const runtime = "nodejs";

/** Forwards multipart case submissions to Railway (large file uploads bypass JSON proxy limits). */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    let origin: string | undefined;
    try {
      origin = new URL(getSiteUrl()).origin;
    } catch {
      origin = undefined;
    }

    const headers: Record<string, string> = {};
    if (origin) {
      headers.Origin = origin;
      headers.Referer = `${origin}/submit-case`;
    }
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

    let body: BodyInit;
    if (isMultipart) {
      headers["Content-Type"] = contentType;
      body = await req.arrayBuffer();
    } else {
      headers["Content-Type"] = "application/json";
      body = await req.text();
    }

    const upstream = await fetch(buildBackendApiUrl("/api/case-submissions"), {
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
    console.error("[public/case-submissions]", error);
    return NextResponse.json({ error: "Cannot reach API. Try again later." }, { status: 502 });
  }
}
