import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { resolvePostAuthEntry } from "@/lib/entry/entry-routing";
import { OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER } from "@/lib/platform-owner/constants";
import { gateOwnerRequest } from "@/lib/platform-owner/middleware-owner-gate";
import { applySecurityHeadersToResponse } from "@/lib/security-headers";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = ["/dashboard", "/portal", "/projects", "/billing", "/admin", "/portfolio", "/subscribe"];
const AUTH_PREFIXES = ["/login", "/register"];

function applyPageSecurityHeaders(res: NextResponse, isProduction: boolean, isDevelopment: boolean): NextResponse {
  return applySecurityHeadersToResponse(res, "page", { isProduction, isDevelopment }) as NextResponse;
}

function applyApiSecurityHeaders(res: NextResponse): NextResponse {
  return applySecurityHeadersToResponse(res, "api") as NextResponse;
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
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  if (pathname.startsWith("/api/")) {
    if (pathname.startsWith("/api/v1")) {
      const forbidden = checkLiteAllowList(pathname, request.method, request.headers.get("x-client"));
      if (forbidden) {
        return applyApiSecurityHeaders(NextResponse.json(forbidden.body, { status: 403 }));
      }
    }

    if (pathname.startsWith("/api/v1/owner")) {
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
      return res;
    }

    return NextResponse.next();
  }

  const pathWithoutLocEarly = pathWithoutLocale(pathname).path;
  const isOwnerPage = pathWithoutLocEarly.startsWith("/owner");

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const redir = NextResponse.redirect(new URL("/en/dashboard", request.url), 308);
    return applyPageSecurityHeaders(redir, isProduction, isDevelopment);
  }

  const { response: sessionResponse, user } = await updateSession(request);
  if (sessionResponse.status === 503) {
    return applyPageSecurityHeaders(sessionResponse, isProduction, isDevelopment);
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
      return applyPageSecurityHeaders(denied, isProduction, isDevelopment);
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
    return applyPageSecurityHeaders(redir, isProduction, isDevelopment);
  }
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get("next") ?? undefined;
    const { path } = resolvePostAuthEntry({ locale, next, baseUrl: request.url });
    const nextUrl = new URL(path, request.url);
    const redir = NextResponse.redirect(nextUrl);
    mergeSupabaseSessionIntoResponse(sessionResponse, redir);
    redir.headers.set("X-Auth-Redirect", "post-auth-entry");
    return applyPageSecurityHeaders(redir, isProduction, isDevelopment);
  }

  mergeSupabaseSessionIntoResponse(sessionResponse, res);
  res.headers.set("X-Auth-Redirect", "pass");
  if (isProtected || isAuthPage) {
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }
  return applyPageSecurityHeaders(res, isProduction, isDevelopment);
}

export const config = {
  matcher: [
    // Exclude all Next internals (_next/data RSC flights, static, image optimizer).
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
