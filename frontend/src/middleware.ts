import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { auth } from "@/auth";

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ??
      request.cookies.get("__Secure-authjs.session-token")?.value ??
      request.cookies.get("next-auth.session-token")?.value ??
      request.cookies.get("__Secure-next-auth.session-token")?.value;

    if (!sessionToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    if (!pathname.startsWith("/admin/security")) {
      const session = await auth();
      if ((session as { requiresMfaSetup?: boolean } | null)?.requiresMfaSetup) {
        const url = new URL("/admin/security", request.url);
        url.searchParams.set("setup", "1");
        return NextResponse.redirect(url);
      }
    }
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
