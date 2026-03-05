import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { getAppUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = ["/dashboard", "/projects", "/billing", "/admin", "/portfolio"];
const AUTH_PREFIXES = ["/login", "/register"];
const LOCALES = ["ru", "en", "es", "it"];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://*.supabase.co; connect-src 'self' https://*.supabase.co; img-src 'self' data:; style-src 'self' 'unsafe-inline';",
};

const HSTS_HEADER = "Strict-Transport-Security";
const HSTS_VALUE = "max-age=31536000; includeSubdomains; preload";

function applySecurityHeaders(res: NextResponse, isProduction: boolean): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => res.headers.set(key, value));
  if (isProduction) res.headers.set(HSTS_HEADER, HSTS_VALUE);
  return res;
}

function pathWithoutLocale(pathname: string): { path: string; locale: string } {
  const match = pathname.match(/^\/(ru|en|es|it)(?=\/|$)/);
  if (match) {
    const rest = pathname.slice(match[0].length) || "/";
    return { path: rest, locale: match[1] };
  }
  return { path: pathname, locale: "ru" };
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === "production";

  if (pathname.startsWith("/api/v1")) {
    const forbidden = checkLiteAllowList(pathname, request.headers.get("x-client"));
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: 403 });
    }
    return NextResponse.next();
  }

  const host = request.headers.get("host") ?? "";
  if (isProduction && host.startsWith("www.")) {
    const url = request.nextUrl;
    const target = new URL(url.pathname + url.search, getAppUrl());
    const redirect = NextResponse.redirect(target, 308);
    return applySecurityHeaders(redirect, isProduction);
  }

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const redir = NextResponse.redirect(new URL("/en/dashboard", request.url), 308);
    return applySecurityHeaders(redir, process.env.NODE_ENV === "production");
  }

  const { response: sessionResponse, user } = await updateSession(request);
  if (sessionResponse.status === 503) {
    return applySecurityHeaders(sessionResponse, process.env.NODE_ENV === "production");
  }
  let res = await intlMiddleware(request);

  const pathnameForLoc = request.nextUrl.pathname;
  const { path: pathWithoutLoc, locale } = pathWithoutLocale(pathnameForLoc);

  const isProtected =
    pathWithoutLoc === "/" ||
    PROTECTED_PREFIXES.some((p) => pathWithoutLoc.startsWith(p));
  const isAuthPage = AUTH_PREFIXES.some((p) => pathWithoutLoc.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathnameForLoc);
    const redir = NextResponse.redirect(loginUrl);
    sessionResponse.headers.forEach((v, k) => redir.headers.set(k, v));
    redir.headers.set("X-Auth-Redirect", "login");
    return applySecurityHeaders(redir, isProduction);
  }
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get("next") ?? `/${locale}/dashboard`;
    const nextUrl = next.startsWith("/") ? new URL(next, request.url) : new URL(`/${locale}/dashboard`, request.url);
    const redir = NextResponse.redirect(nextUrl);
    sessionResponse.headers.forEach((v, k) => redir.headers.set(k, v));
    redir.headers.set("X-Auth-Redirect", "dashboard");
    return applySecurityHeaders(redir, isProduction);
  }

  sessionResponse.headers.forEach((v, k) => res.headers.set(k, v));
  res.headers.set("X-Auth-Redirect", "pass");
  if (isProtected || pathWithoutLoc === "/" || isAuthPage) {
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }
  return applySecurityHeaders(res, isProduction);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/v1/:path*",
  ],
};
