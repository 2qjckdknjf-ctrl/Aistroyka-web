import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { resolvePostAuthEntry } from "@/lib/entry/entry-routing";
import { OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER } from "@/lib/platform-owner/constants";
import { gateOwnerRequest } from "@/lib/platform-owner/middleware-owner-gate";
import { applyApiSecurityHeadersToHeaders, getPageSecurityHeaders } from "@/lib/security-headers";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = ["/dashboard", "/portal", "/projects", "/billing", "/admin", "/portfolio", "/subscribe"];
const AUTH_PREFIXES = ["/login", "/register"];

const SECURITY_HEADERS = getPageSecurityHeaders(process.env.NODE_ENV === "development");

const HSTS_HEADER = "Strict-Transport-Security";
const HSTS_VALUE = "max-age=31536000; includeSubdomains; preload";

function applyPageSecurityHeaders(res: NextResponse, isProduction: boolean): NextResponse {
  SECURITY_HEADERS.forEach(({ key, value }) => res.headers.set(key, value));
  if (isProduction) res.headers.set(HSTS_HEADER, HSTS_VALUE);
  return res;
}

function applyApiSecurityHeaders(res: NextResponse): NextResponse {
  applyApiSecurityHeadersToHeaders(res.headers);
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
      return applyApiSecurityHeaders(NextResponse.json(forbidden.body, { status: 403 }));
    }
  }

  if (isOwnerApi) {
    const { response: sessionResponse, user } = await updateSession(request);
    if (sessionResponse.status === 503) {
      return applyApiSecurityHeaders(sessionResponse);
    }
    const denied = await gateOwnerRequest({
      request,
      sessionResponse,
      user,
      pathname,
      isApi: true,
    });
    if (denied) {
      return applyApiSecurityHeaders(denied);
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER, "1");
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    mergeSupabaseSessionIntoResponse(sessionResponse, res);
    return applyApiSecurityHeaders(res);
  }

  if (pathname.startsWith("/api/v1")) {
    return applyApiSecurityHeaders(NextResponse.next());
  }

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const redir = NextResponse.redirect(new URL("/en/dashboard", request.url), 308);
    return applyPageSecurityHeaders(redir, process.env.NODE_ENV === "production");
  }

  const { response: sessionResponse, user } = await updateSession(request);
  if (sessionResponse.status === 503) {
    return applyPageSecurityHeaders(sessionResponse, process.env.NODE_ENV === "production");
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
      return applyPageSecurityHeaders(denied, isProduction);
    }
  }

  const res = await intlMiddleware(request);

  const pathnameForLoc = request.nextUrl.pathname;
  const { path: pathWithoutLoc, locale } = pathWithoutLocale(pathnameForLoc);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathWithoutLoc.startsWith(p));
  const isAuthPage = AUTH_PREFIXES.some((p) => pathWithoutLoc.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathnameForLoc);
    const redir = NextResponse.redirect(loginUrl);
    mergeSupabaseSessionIntoResponse(sessionResponse, redir);
    redir.headers.set("X-Auth-Redirect", "login");
    return applyPageSecurityHeaders(redir, isProduction);
  }
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get("next") ?? undefined;
    const { path } = resolvePostAuthEntry({ locale, next, baseUrl: request.url });
    const nextUrl = new URL(path, request.url);
    const redir = NextResponse.redirect(nextUrl);
    mergeSupabaseSessionIntoResponse(sessionResponse, redir);
    redir.headers.set("X-Auth-Redirect", "post-auth-entry");
    return applyPageSecurityHeaders(redir, isProduction);
  }

  mergeSupabaseSessionIntoResponse(sessionResponse, res);
  res.headers.set("X-Auth-Redirect", "pass");
  if (isProtected || isAuthPage) {
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }
  return applyPageSecurityHeaders(res, isProduction);
}

export const config = {
  matcher: [
    // Exclude api (handled by second matcher), all Next internals (_next/data RSC flights, static, image optimizer).
    "/((?!api|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/v1/:path*",
  ],
};
