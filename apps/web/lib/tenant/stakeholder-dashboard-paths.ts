import { NextResponse } from "next/server";

/** Customer portal home — the only list surface for portal-only stakeholders. */
export const STAKEHOLDER_PORTAL_HOME = "/portal/projects";

/** Shown with 503 when the stakeholder gate cannot resolve the user's role. */
export const ACCESS_CHECK_UNAVAILABLE_PATH = "/access-check-unavailable";

function portalHomeUrl(locale: string, requestUrl: string): URL {
  return new URL(`/${locale}${STAKEHOLDER_PORTAL_HOME}`, requestUrl);
}

/**
 * Returns a redirect when a portal-only stakeholder must not stay on the requested dashboard path.
 * Paths are without locale prefix (e.g. /dashboard/projects).
 */
export function redirectIfStakeholderBlockedPath(
  pathWithoutLocale: string,
  locale: string,
  requestUrl: string
): NextResponse | null {
  if (pathWithoutLocale === "/portal" || pathWithoutLocale === "/portal/") {
    return NextResponse.redirect(portalHomeUrl(locale, requestUrl));
  }

  const portalAllowed =
    pathWithoutLocale === "/portal/projects" || /^\/portal\/projects\//.test(pathWithoutLocale);
  if (pathWithoutLocale.startsWith("/portal") && !portalAllowed) {
    return NextResponse.redirect(portalHomeUrl(locale, requestUrl));
  }

  if (
    pathWithoutLocale === "/dashboard" ||
    pathWithoutLocale === "/dashboard/" ||
    pathWithoutLocale === "/dashboard/projects" ||
    pathWithoutLocale === "/dashboard/projects/"
  ) {
    return NextResponse.redirect(portalHomeUrl(locale, requestUrl));
  }

  const detail = pathWithoutLocale.match(/^\/dashboard\/projects\/([^/]+)$/);
  if (detail?.[1]) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard/projects/${detail[1]}/client`, requestUrl));
  }

  const allowed =
    pathWithoutLocale.startsWith("/dashboard/stakeholder-invite") ||
    /^\/dashboard\/projects\/[^/]+\/client(\/|$)/.test(pathWithoutLocale);

  if (pathWithoutLocale.startsWith("/dashboard") && !allowed) {
    return NextResponse.redirect(portalHomeUrl(locale, requestUrl));
  }

  if (
    pathWithoutLocale.startsWith("/billing") ||
    pathWithoutLocale.startsWith("/admin") ||
    pathWithoutLocale.startsWith("/portfolio") ||
    pathWithoutLocale.startsWith("/projects") ||
    pathWithoutLocale.startsWith("/team")
  ) {
    return NextResponse.redirect(portalHomeUrl(locale, requestUrl));
  }

  return null;
}

/**
 * Fail-closed counterpart of `redirectIfStakeholderBlockedPath` for role lookup failures:
 * any path the stakeholder gate would intervene on is answered with a 503 page instead of
 * being served, because the caller may be a portal-only stakeholder.
 */
export function stakeholderGateUnavailableResponse(
  pathWithoutLocale: string,
  locale: string,
  requestUrl: string
): NextResponse | null {
  if (!redirectIfStakeholderBlockedPath(pathWithoutLocale, locale, requestUrl)) return null;
  const res = NextResponse.rewrite(new URL(`/${locale}${ACCESS_CHECK_UNAVAILABLE_PATH}`, requestUrl), {
    status: 503,
  });
  res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.headers.set("Retry-After", "30");
  return res;
}
