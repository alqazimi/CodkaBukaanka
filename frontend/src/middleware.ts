import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { USER_LOCALE_CHOICE_COOKIE, userChoseEnglish, toSomaliPath } from "@/lib/locale-preference";

const intlMiddleware = createMiddleware(routing);

function withPathnameRequest(request: NextRequest, pathname: string): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return requestHeaders;
}

function nextWithPathname(request: NextRequest, pathname: string) {
  return NextResponse.next({
    request: { headers: withPathnameRequest(request, pathname) },
  });
}

function redirectToLogin(request: NextRequest) {
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

/** English URLs only if the user tapped the translate button (cookie). */
function enforceSomaliUnlessEnglishChosen(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname !== "/en" && !pathname.startsWith("/en/")) return null;

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
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value ??
      request.cookies.get("next-auth.session-token")?.value ??
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
      return redirectToLogin(request);
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

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
