import { NextResponse, NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";
import { checkLiteAllowList } from "@/lib/api/lite-allow-list";
import { resolvePostAuthEntry } from "@/lib/entry/entry-routing";
import { OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER } from "@/lib/platform-owner/constants";
import { gateOwnerRequest } from "@/lib/platform-owner/middleware-owner-gate";
import { isPlatformAdminApiPath, isPlatformAdminPagePath } from "@/lib/platform-admin/middleware-paths";
import { resolveHostProfile } from "@/lib/platform-admin/host-policy";
import { isAdminHostBlockedApiPath, resolveAdminHostPageRouting } from "@/lib/platform-admin/host-routing";
import { applyApiSecurityHeadersToHeaders } from "@/lib/security-headers";
import { getActiveTenantRoleForUser } from "@/lib/tenant/tenant-role.server";
import { isPortalOnlyTenantRole } from "@/lib/tenant/tenant.policy";
import { redirectIfStakeholderBlockedPath } from "@/lib/tenant/stakeholder-dashboard-paths";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PREFIXES = ["/dashboard", "/portal", "/projects", "/billing", "/admin", "/portfolio", "/subscribe"];
const AUTH_PREFIXES = ["/login", "/register", "/forgot-password"];

/**
 * Page/HTML security headers (CSP, HSTS, XFO, …) are owned solely by
 * `next.config.js` `headers()` — do NOT set them here. Dual owners produce
 * Cloudflare joined duplicates (`nosniff, nosniff`) and fail production smoke.
 * Middleware keeps API hardening, host/auth routing headers, cookies, cache.
 */

function applyHostProfileHeader(res: NextResponse, request: NextRequest): NextResponse {
  res.headers.set("X-Aistroyka-Host-Profile", resolveHostProfile(request.headers.get("host")));
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
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-aistroyka-pathname", pathname);
  const requestWithPath = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
  });
  const pathWithoutLocEarly = pathWithoutLocale(pathname).path;
  const isPlatformAdminPage = isPlatformAdminPagePath(pathWithoutLocEarly);
  const isPlatformAdminApi = isPlatformAdminApiPath(pathname);

  if (pathname.startsWith("/api/v1")) {
    const forbidden = checkLiteAllowList(pathname, request.method, request.headers.get("x-client"));
    if (forbidden) {
      const res = applyApiSecurityHeaders(NextResponse.json(forbidden.body, { status: 403 }));
      return applyHostProfileHeader(res, request);
    }

    if (isAdminHostBlockedApiPath(request.headers.get("host"), pathname)) {
      const res = applyApiSecurityHeaders(
        NextResponse.json({ error: "admin_host_api_forbidden" }, { status: 403 })
      );
      return applyHostProfileHeader(res, request);
    }
  }

  if (isPlatformAdminApi) {
    const { response: sessionResponse, user } = await updateSession(request);
    if (sessionResponse.status === 503) {
      const res = applyApiSecurityHeaders(sessionResponse);
      return applyHostProfileHeader(res, request);
    }
    const denied = await gateOwnerRequest({
      request,
      sessionResponse,
      user,
      pathname,
      isApi: true,
    });
    if (denied) {
      const res = applyApiSecurityHeaders(denied);
      return applyHostProfileHeader(res, request);
    }
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(OWNER_RATE_LIMIT_ALREADY_APPLIED_HEADER, "1");
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    mergeSupabaseSessionIntoResponse(sessionResponse, res);
    return applyHostProfileHeader(applyApiSecurityHeaders(res), request);
  }

  if (pathname.startsWith("/api/v1")) {
    const res = applyApiSecurityHeaders(NextResponse.next());
    return applyHostProfileHeader(res, request);
  }

  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    const redir = NextResponse.redirect(new URL("/en/dashboard", request.url), 308);
    return applyHostProfileHeader(redir, request);
  }

  const { response: sessionResponse, user, supabase } = await updateSession(request);
  if (sessionResponse.status === 503) {
    return applyHostProfileHeader(sessionResponse, request);
  }

  const host = request.headers.get("host");
  const { path: pathWithoutLocForHost, locale: localeForHost } = pathWithoutLocale(pathname);
  const adminHostRouting = resolveAdminHostPageRouting(host, pathWithoutLocForHost, localeForHost);
  if (adminHostRouting.action === "redirect") {
    const redir = NextResponse.redirect(new URL(adminHostRouting.targetPath, request.url), 307);
    redir.headers.set("X-Aistroyka-Host-Routing", adminHostRouting.reason);
    mergeSupabaseSessionIntoResponse(sessionResponse, redir);
    return applyHostProfileHeader(redir, request);
  }

  if (isPlatformAdminPage && user) {
    const denied = await gateOwnerRequest({
      request,
      sessionResponse,
      user,
      pathname,
      isApi: false,
    });
    if (denied) {
      return applyHostProfileHeader(denied, request);
    }
  }

  const res = await intlMiddleware(requestWithPath);

  const pathnameForLoc = request.nextUrl.pathname;
  const { path: pathWithoutLoc, locale } = pathWithoutLocale(pathnameForLoc);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathWithoutLoc.startsWith(p));
  const isPlatformAdminPageAfterIntl = isPlatformAdminPagePath(pathWithoutLoc);
  const isAuthPage = AUTH_PREFIXES.some((p) => pathWithoutLoc.startsWith(p));

  if (!user && (isProtected || isPlatformAdminPageAfterIntl)) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathnameForLoc);
    const redir = NextResponse.redirect(loginUrl);
    mergeSupabaseSessionIntoResponse(sessionResponse, redir);
    redir.headers.set(
      "X-Auth-Redirect",
      isPlatformAdminPageAfterIntl ? "platform-admin-login" : "login"
    );
    return applyHostProfileHeader(redir, request);
  }
  if (user && supabase) {
    try {
      const role = await getActiveTenantRoleForUser(supabase, user.id);
      if (isPortalOnlyTenantRole(role)) {
        const blocked = redirectIfStakeholderBlockedPath(pathWithoutLoc, locale, request.url);
        if (blocked) {
          mergeSupabaseSessionIntoResponse(sessionResponse, blocked);
          blocked.headers.set("X-Auth-Redirect", "stakeholder-portal");
          blocked.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
          return applyHostProfileHeader(blocked, request);
        }
      }
    } catch {
      // fail-open: role lookup errors must not lock contractor dashboards
    }
  }
  if (isAuthPage && user) {
    const next = request.nextUrl.searchParams.get("next") ?? undefined;
    const { path } = resolvePostAuthEntry({ locale, next, baseUrl: request.url });
    const nextUrl = new URL(path, request.url);
    const redir = NextResponse.redirect(nextUrl);
    mergeSupabaseSessionIntoResponse(sessionResponse, redir);
    redir.headers.set("X-Auth-Redirect", "post-auth-entry");
    return applyHostProfileHeader(redir, request);
  }

  mergeSupabaseSessionIntoResponse(sessionResponse, res);
  res.headers.set("X-Auth-Redirect", "pass");
  if (isProtected || isAuthPage) {
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  }
  return applyHostProfileHeader(res, request);
}

export const config = {
  matcher: [
    // Exclude api (handled by second matcher), all Next internals (_next/data RSC flights, static, image optimizer).
    "/((?!api|_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    "/api/v1/:path*",
  ],
};
