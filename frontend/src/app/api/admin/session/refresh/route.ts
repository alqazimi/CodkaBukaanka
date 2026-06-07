import { auth } from "@/auth";
import { getBackendAccessToken } from "@/lib/get-backend-token";
import {
  encodeSessionWithAccessToken,
  refreshBackendAccessToken,
  sessionCookieOptions,
} from "@/lib/refresh-admin-session";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function buildCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>): string {
  return cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
}

function safeRedirectTarget(req: NextRequest, raw: string | null): string {
  if (!raw?.startsWith("/admin")) return "/admin";
  if (raw.startsWith("//")) return "/admin";
  return raw;
}

async function refreshSession(): Promise<
  { ok: true; accessToken: string; encoded: { cookieName: string; value: string } } | { ok: false; status: number }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, status: 401 };
  }

  const currentToken = await getBackendAccessToken();
  if (!currentToken) {
    return { ok: false, status: 401 };
  }

  const newAccessToken = await refreshBackendAccessToken(currentToken);
  if (!newAccessToken) {
    return { ok: false, status: 401 };
  }

  const cookieStore = await cookies();
  const encoded = await encodeSessionWithAccessToken(buildCookieHeader(cookieStore), newAccessToken);
  if (!encoded) {
    return { ok: false, status: 401 };
  }

  return { ok: true, accessToken: newAccessToken, encoded };
}

function applySessionCookie<T extends NextResponse>(response: T, encoded: { cookieName: string; value: string }): T {
  response.cookies.set(encoded.cookieName, encoded.value, sessionCookieOptions());
  return response;
}

/** JSON refresh for client-side session extension (AdminSessionRefresh). */
export async function POST() {
  const result = await refreshSession();
  if (!result.ok) {
    return NextResponse.json({ error: "Unauthorized", code: "session_expired" }, { status: result.status });
  }

  return applySessionCookie(
    NextResponse.json({ ok: true, accessToken: result.accessToken }),
    result.encoded
  );
}

/** Server-side refresh + redirect (used when token is about to expire during navigation). */
export async function GET(req: NextRequest) {
  const next = safeRedirectTarget(req, req.nextUrl.searchParams.get("next"));
  const result = await refreshSession();

  if (!result.ok) {
    const login = new URL("/admin/login", req.url);
    login.searchParams.set("reason", "expired");
    return NextResponse.redirect(login);
  }

  return applySessionCookie(NextResponse.redirect(new URL(next, req.url)), result.encoded);
}
