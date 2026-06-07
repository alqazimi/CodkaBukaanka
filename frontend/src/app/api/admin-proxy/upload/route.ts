import { auth } from "@/auth";
import { ensureHttpsUrl, getServerApiUrl, getSiteUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";
import { mapAdminApiError } from "@/lib/login-error-message";
import { MAX_EVIDENCE_FILE_MB } from "@/lib/submission-evidence";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function proxyOrigin(): string | undefined {
  try {
    return new URL(getSiteUrl()).origin;
  } catch {
    return process.env.AUTH_URL?.replace(/\/$/, "");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getBackendAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const url = new URL("/api/admin/upload", `${ensureHttpsUrl(getServerApiUrl())}/`);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };
    const origin = proxyOrigin();
    if (origin) {
      headers.Origin = origin;
      headers.Referer = `${origin}/admin`;
    }

    const upstream = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
    });

    const body = await upstream.text();
    if (!upstream.ok) {
      let message = `Upload failed (${upstream.status})`;
      let code: string | undefined;
      try {
        const parsed = JSON.parse(body) as { error?: string; code?: string };
        if (typeof parsed.code === "string") code = parsed.code;
        if (typeof parsed.error === "string") message = parsed.error;
      } catch {
        // non-JSON body
      }
      return NextResponse.json(
        { error: mapAdminApiError(upstream.status, message, code), code },
        { status: upstream.status }
      );
    }

    return new NextResponse(body, {
      status: upstream.status,
      headers: upstream.headers.get("content-type")
        ? { "content-type": upstream.headers.get("content-type")! }
        : undefined,
    });
  } catch (error) {
    console.error("[admin-proxy/upload]", error);
    return NextResponse.json(
      { error: `Upload proxy failed. Try a smaller file (under ${MAX_EVIDENCE_FILE_MB}MB) or check API_URL on Vercel.` },
      { status: 500 }
    );
  }
}
