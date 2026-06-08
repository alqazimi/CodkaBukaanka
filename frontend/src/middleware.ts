import createMiddleware from "next-intl/middleware";
import { NextResponse, NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { USER_LOCALE_CHOICE_COOKIE, userChoseEnglish, toSomaliPath } from "@/lib/locale-preference";
import { buildContentSecurityPolicy } from "@/lib/csp";
import {
  getCanonicalHost,
  isCanonicalHost,
  shouldEnforceCanonicalHost,
} from "@/lib/canonical-site";
import { attachTrustHeaders } from "@/lib/trust-headers";
import { logger } from "@/lib/logger";
import {
  isValidAdminSessionJwt,
  readSessionJwtFromRequest,
  sessionCookieCandidates,
} from "@/lib/read-session-jwt";

const intlMiddleware = createMiddleware(routing);
const isProduction = process.env.NODE_ENV === "production";

function withPathnameRequest(request: NextRequest, pathname: string, nonce?: string): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  if (nonce) requestHeaders.set("x-nonce", nonce);
  return requestHeaders;
}

function createNonce(): string {
  return crypto.randomUUID();
}

function attachPageSecurity(response: NextResponse, nonce: string, pathname: string): NextResponse {
  if (isProduction) {
    response.headers.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  }
  attachTrustHeaders(response, pathname);
  return response;
}

/** Next.js injects script nonces from the CSP on the *request* during SSR. */
function withRequestSecurity(request: NextRequest, pathname: string) {
  const nonce = createNonce();
  const requestHeaders = withPathnameRequest(request, pathname, nonce);
  if (isProduction) {
    requestHeaders.set("Content-Security-Policy", buildContentSecurityPolicy(nonce));
  }
  return { nonce, requestHeaders };
}

function nextWithPathname(request: NextRequest, pathname: string) {
  const { nonce, requestHeaders } = withRequestSecurity(request, pathname);
  return attachPageSecurity(
    NextResponse.next({
      request: { headers: requestHeaders },
    }),
    nonce,
    pathname
  );
}

function redirectToLogin(request: NextRequest, reason?: "session" | "expired") {
  const url = new URL("/admin/login", request.url);
  if (reason) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

async function hasValidAdminSession(request: NextRequest): Promise<boolean> {
  const seen = new Set<string>();

  for (const cookieName of sessionCookieCandidates()) {
    if (seen.has(cookieName)) continue;
    seen.add(cookieName);

    const token = await readSessionJwtFromRequest(request, cookieName);
    if (token && isValidAdminSessionJwt(token)) return true;
  }

  return false;
}

/** Force HTTPS + single canonical host in production (avoids duplicate URLs that look suspicious). */
function enforceCanonicalSiteUrl(request: NextRequest): NextResponse | null {
  if (!shouldEnforceCanonicalHost()) return null;

  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto");
  const canonicalHost = getCanonicalHost();
  const needsHttps = proto === "http";
  const needsHost = !isCanonicalHost(host);

  if (!needsHttps && !needsHost) return null;

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = canonicalHost;
  return NextResponse.redirect(url, 308);
}

/** English URLs only if the user tapped the translate button (cookie). Search bots may crawl /en/ for hreflang. */
function isSearchEngineBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return /Googlebot|Google-InspectionTool|Storebot-Google|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|Applebot/i.test(
    userAgent
  );
}

function enforceSomaliUnlessEnglishChosen(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname !== "/en" && !pathname.startsWith("/en/")) return null;

  if (isSearchEngineBot(request.headers.get("user-agent"))) return null;

  const choice = request.cookies.get(USER_LOCALE_CHOICE_COOKIE)?.value;
  if (userChoseEnglish(choice)) return null;

  const soPath = toSomaliPath(pathname);
  const url = request.nextUrl.clone();
  url.pathname = soPath;
  const res = NextResponse.redirect(url);
  res.cookies.set(USER_LOCALE_CHOICE_COOKIE, "so", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  res.cookies.set("NEXT_LOCALE", "so", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export default async function middleware(request: NextRequest) {
  const canonicalRedirect = enforceCanonicalSiteUrl(request);
  if (canonicalRedirect) return canonicalRedirect;

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!(await hasValidAdminSession(request))) {
      logger.debug("[middleware] blocked admin route — invalid session", pathname);
      return redirectToLogin(request, "session");
    }
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return nextWithPathname(request, pathname);
  }

  const somaliRedirect = enforceSomaliUnlessEnglishChosen(request);
  if (somaliRedirect) return somaliRedirect;

  const { nonce, requestHeaders } = withRequestSecurity(request, pathname);
  const intlResponse = intlMiddleware(
    new NextRequest(request.url, {
      headers: requestHeaders,
    })
  );
  return attachPageSecurity(intlResponse, nonce, pathname);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
