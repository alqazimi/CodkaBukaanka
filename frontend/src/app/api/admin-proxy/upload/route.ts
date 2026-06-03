import { auth } from "@/auth";
import { ensureHttpsUrl, getServerApiUrl, getSiteUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";
import { NextRequest, NextResponse } from "next/server";

function proxyOrigin(): string | undefined {
  try {
    return new URL(getSiteUrl()).origin;
  } catch {
    return process.env.AUTH_URL?.replace(/\/$/, "");
  }
}

export async function POST(req: NextRequest) {
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
  if (origin) headers.Origin = origin;

  const upstream = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: formData,
    cache: "no-store",
  });

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: upstream.headers.get("content-type")
      ? { "content-type": upstream.headers.get("content-type")! }
      : undefined,
  });
}
