import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { resolvePostAuthEntry } from "@/lib/entry/entry-routing";
import { OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER } from "@/lib/platform-owner/constants";
import { gateOwnerRequest } from "@/lib/platform-owner/middleware-owner-gate";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = ["/dashboard", "/portal", "/projects", "/billing", "/admin", "/portfolio", "/subscribe"];
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

/** Preserves multiple Supabase auth cookies; `headers.set("set-cookie")` would drop duplicates. */
function mergeSupabaseSessionIntoResponse(sessionResponse: NextResponse, target: NextResponse): void {
  for (const c of sessionResponse.cookies.getAll()) {
    target.cookies.set(c.name, c.value, c as never);
  }
  sessionResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    target.headers.set(key, value);
  });
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
  const pathWithoutLocEarly = pathWithoutLocale(pathname).path;
  const isOwnerPage = pathWithoutLocEarly.startsWith("/owner");
  const isOwnerApi = pathname.startsWith("/api/v1/owner");

  if (pathname.startsWith("/api/v1")) {
    const forbidden = checkLiteAllowList(pathname, request.method, request.headers.get("x-client"));
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: 403 });
    }
  }

  if (isOwnerApi) {
    const { response: sessionResponse, user } = await updateSession(request);
    if (sessionResponse.status === 503) {
      return applySecurityHeaders(sessionResponse, isProduction);
    }
    const denied = await gateOwnerRequest({
      request,
      sessionResponse,
      user,
      pathname,
      isApi: true,
    });
    if (denied) {
      return applySecurityHeaders(denied, isProduction);
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER, "1");
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    mergeSupabaseSessionIntoResponse(sessionResponse, res);
    return applySecurityHeaders(res, isProduction);
  }

  if (pathname.startsWith("/api/v1")) {
    return NextResponse.next();
  }

  // Domain canonicalization (www vs apex) is handled only by Vercel Domains; no host-based redirects here.

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const redir = NextResponse.redirect(new URL("/en/dashboard", request.url), 308);
    return applySecurityHeaders(redir, process.env.NODE_ENV === "production");
  }

  const { response: sessionResponse, user } = await updateSession(request);
  if (sessionResponse.status === 503) {
    return applySecurityHeaders(sessionResponse, process.env.NODE_ENV === "production");
  }

  if (isOwnerPage) {
    const denied = await gateOwnerRequest({
      request,
      sessionResponse,
      user,
      pathname,
      isApi: false,
    });
    if (denied) {
      return applySecurityHeaders(denied, isProduction);
    }
  }

  let res = await intlMiddleware(request);

  const pathnameForLoc = request.nextUrl.pathname;
  const { path: pathWithoutLoc, locale } = pathWithoutLocale(pathnameForLoc);

  // Locale root "/" and public paths (features, pricing, etc.) are NOT protected
  const isProtected = PROTECTED_PREFIXES.some((p) => pathWithoutLoc.startsWith(p));
  const isAuthPage = AUTH_PREFIXES.some((p) => pathWithoutLoc.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathnameForLoc);
    const redir = NextResponse.redirect(loginUrl);
    mergeSupabaseSessionIntoResponse(sessionResponse, redir);
    redir.headers.set("X-Auth-Redirect", "login");
    return applySecurityHeaders(redir, isProduction);
  }
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get("next") ?? undefined;
    const { path } = resolvePostAuthEntry({ locale, next, baseUrl: request.url });
    const nextUrl = new URL(path, request.url);
    const redir = NextResponse.redirect(nextUrl);
    mergeSupabaseSessionIntoResponse(sessionResponse, redir);
    redir.headers.set("X-Auth-Redirect", "post-auth-entry");
    return applySecurityHeaders(redir, isProduction);
  }

  mergeSupabaseSessionIntoResponse(sessionResponse, res);
  res.headers.set("X-Auth-Redirect", "pass");
  if (isProtected || isAuthPage) {
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
