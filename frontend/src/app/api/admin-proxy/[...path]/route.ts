import { auth } from "@/auth";
import { ensureHttpsUrl, getServerApiUrl, getSiteUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";
import { NextRequest, NextResponse } from "next/server";

function backendUrl(pathSegments: string[], search: string): string {
  const path = pathSegments.join("/");
  const base = ensureHttpsUrl(getServerApiUrl());
  const url = new URL(path, `${base}/`);
  if (search) url.search = search;
  return url.toString();
}

function proxyOrigin(): string | undefined {
  try {
    return new URL(getSiteUrl()).origin;
  } catch {
    return process.env.AUTH_URL?.replace(/\/$/, "");
  }
}

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context, "GET");
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context, "POST");
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context, "PATCH");
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(req, context, "DELETE");
}

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
  method: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    const accessToken = await getBackendAccessToken();
    if (!accessToken) return unauthorized();

    const { path } = await context.params;
    const url = backendUrl(path, req.nextUrl.search);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    };

    const origin = proxyOrigin();
    const isRead = method === "GET" || method === "HEAD";
    if (origin && !isRead) {
      headers.Origin = origin;
      if (!req.headers.get("referer")) {
        headers.Referer = `${origin}/admin`;
      }
    }

    const referer = req.headers.get("referer");
    if (referer && !isRead) headers.Referer = referer;

    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

    const userAgent = req.headers.get("user-agent");
    if (userAgent) headers["User-Agent"] = userAgent;

    const contentType = req.headers.get("content-type");
    if (contentType) headers["Content-Type"] = contentType;

    const actionToken = req.headers.get("x-admin-action-token");
    if (actionToken) headers["x-admin-action-token"] = actionToken;

    const body =
      method !== "GET" && method !== "HEAD" ? await req.arrayBuffer().catch(() => undefined) : undefined;

    const upstream = await fetch(url, {
      method,
      headers,
      body: body && body.byteLength > 0 ? body : undefined,
      cache: "no-store",
    });

    const responseBody = await upstream.arrayBuffer();
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("content-type", upstreamType);

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[admin-proxy]", error);
    const message = error instanceof Error ? error.message : "Admin proxy failed";
    return NextResponse.json(
      {
        error:
          "Cannot reach Railway API from admin proxy. Set API_URL on Vercel to your Railway backend URL (https://….up.railway.app).",
        code: "api_unreachable",
        detail: process.env.NODE_ENV === "production" ? undefined : message,
      },
      { status: 502 }
    );
  }
}
