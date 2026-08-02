import { NextResponse } from "next/server";

/**
 * Returns a redirect when a portal-only stakeholder must not stay on the requested dashboard path.
 * Paths are without locale prefix (e.g. /dashboard/projects).
 * Safe entry for blocked paths is /portal/projects (portal-only shell home).
 */
export function redirectIfStakeholderBlockedPath(
  pathWithoutLocale: string,
  locale: string,
  requestUrl: string
): NextResponse | null {
  const portalHome = new URL(`/${locale}/portal/projects`, requestUrl);

  if (pathWithoutLocale === "/portal" || pathWithoutLocale === "/portal/") {
    return NextResponse.redirect(portalHome);
  }

  const portalAllowed =
    pathWithoutLocale === "/portal/projects" || /^\/portal\/projects\//.test(pathWithoutLocale);
  if (pathWithoutLocale.startsWith("/portal") && !portalAllowed) {
    return NextResponse.redirect(portalHome);
  }

  if (pathWithoutLocale === "/dashboard" || pathWithoutLocale === "/dashboard/") {
    return NextResponse.redirect(portalHome);
  }

  const detail = pathWithoutLocale.match(/^\/dashboard\/projects\/([^/]+)$/);
  if (detail?.[1]) {
    return NextResponse.redirect(
      new URL(`/${locale}/dashboard/projects/${detail[1]}/client`, requestUrl)
    );
  }

  const allowed =
    pathWithoutLocale === "/dashboard/projects" ||
    pathWithoutLocale.startsWith("/dashboard/stakeholder-invite") ||
    /^\/dashboard\/projects\/[^/]+\/client(\/|$)/.test(pathWithoutLocale);

  if (pathWithoutLocale.startsWith("/dashboard") && !allowed) {
    return NextResponse.redirect(portalHome);
  }

  if (
    pathWithoutLocale.startsWith("/billing") ||
    pathWithoutLocale.startsWith("/admin") ||
    pathWithoutLocale.startsWith("/portfolio") ||
    pathWithoutLocale.startsWith("/projects")
  ) {
    return NextResponse.redirect(portalHome);
  }

  return null;
}
