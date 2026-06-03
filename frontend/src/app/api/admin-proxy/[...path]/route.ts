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
  if (origin) headers.Origin = origin;

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
}
