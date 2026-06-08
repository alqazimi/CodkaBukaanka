import { auth } from "@/auth";
import { getAuthConfigStatus, authConfigUserMessage } from "@/lib/auth-config-status";
import { getBackendAccessToken } from "@/lib/get-backend-token";
import { logger } from "@/lib/logger";
import { isValidAdminSessionJwt, readSessionJwtFromCookieHeader, sessionCookieCandidates } from "@/lib/read-session-jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Lightweight check that the httpOnly session cookie includes a backend JWT. */
export async function GET() {
  const config = getAuthConfigStatus();
  if (!config.ready) {
    return NextResponse.json(
      { ok: false, reason: "auth_misconfigured", message: authConfigUserMessage(config) },
      { status: 503 }
    );
  }

  let session;
  try {
    session = await auth();
  } catch (error) {
    logger.error("[admin][session][verify] auth() failed", error);
    return NextResponse.json({ ok: false, reason: "auth_misconfigured" }, { status: 503 });
  }

  const token = await getBackendAccessToken();

  if (!session?.user?.id) {
    logger.debug("[admin][session][verify] missing NextAuth session user");
    return NextResponse.json({ ok: false, reason: "no_session" }, { status: 401 });
  }

  if (!token) {
    logger.debug("[admin][session][verify] missing backend access token");
    return NextResponse.json({ ok: false, reason: "no_token" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  let jwtValid = false;
  for (const cookieName of sessionCookieCandidates()) {
    const jwt = await readSessionJwtFromCookieHeader(cookieHeader, cookieName);
    if (jwt && isValidAdminSessionJwt(jwt)) {
      jwtValid = true;
      break;
    }
  }

  if (!jwtValid) {
    logger.debug("[admin][session][verify] session cookie failed validation");
    return NextResponse.json({ ok: false, reason: "invalid_session" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  const requiresMfaSetup = (session as { requiresMfaSetup?: boolean }).requiresMfaSetup === true;

  return NextResponse.json({
    ok: true,
    user: {
      id: session.user.id,
      role,
      requiresMfaSetup,
    },
  });
}
