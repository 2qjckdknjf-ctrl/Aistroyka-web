import { routing } from "@/i18n/routing";
import { isPlatformAdminHost } from "./host-policy";
import { isPlatformAdminApiPath, isPlatformAdminPagePath } from "./middleware-paths";

/** Public marketing surfaces — not primary entry on admin host. */
const ADMIN_HOST_MARKETING_PREFIXES = [
  "/about",
  "/ai-construction-control",
  "/ai-demo",
  "/api",
  "/cases",
  "/contact",
  "/copilot",
  "/docs",
  "/enterprise",
  "/faq",
  "/features",
  "/implementation",
  "/integrations",
  "/mobile",
  "/partners",
  "/platform",
  "/pricing",
  "/privacy",
  "/projects-showcase",
  "/security",
  "/solutions",
  "/terms",
  "/account-deletion",
  "/workflows",
] as const;

/** Tenant/product cabinet routes — not entry points on admin host. */
const ADMIN_HOST_TENANT_PREFIXES = [
  "/dashboard",
  "/portal",
  "/projects",
  "/billing",
  "/portfolio",
  "/subscribe",
  "/admin",
  "/invite",
  "/smoke",
] as const;

const ADMIN_HOST_AUTH_PREFIXES = ["/login", "/register", "/telegram"] as const;

export type AdminHostPageRouting =
  | { action: "allow" }
  | { action: "redirect"; targetPath: string; reason: "platform_admin_landing" };

export function resolvePlatformAdminLandingPath(locale: string): string {
  const normalized = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
  return `/${normalized}/platform-admin`;
}

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isAdminHostMarketingPath(pathWithoutLocale: string): boolean {
  return matchesPrefix(pathWithoutLocale, ADMIN_HOST_MARKETING_PREFIXES);
}

export function isAdminHostTenantPath(pathWithoutLocale: string): boolean {
  return matchesPrefix(pathWithoutLocale, ADMIN_HOST_TENANT_PREFIXES);
}

export function isAdminHostAuthPath(pathWithoutLocale: string): boolean {
  return matchesPrefix(pathWithoutLocale, ADMIN_HOST_AUTH_PREFIXES);
}

/** Page routes allowed on admin host without redirect to platform-admin landing. */
export function isAdminHostAllowedPagePath(pathWithoutLocale: string): boolean {
  if (pathWithoutLocale === "/" || pathWithoutLocale === "") return false;
  if (isPlatformAdminPagePath(pathWithoutLocale)) return true;
  if (isAdminHostAuthPath(pathWithoutLocale)) return true;
  return false;
}

export function resolveAdminHostPageRouting(
  host: string | null | undefined,
  pathWithoutLocale: string,
  locale: string
): AdminHostPageRouting {
  if (!isPlatformAdminHost(host)) {
    return { action: "allow" };
  }

  if (isAdminHostAllowedPagePath(pathWithoutLocale)) {
    return { action: "allow" };
  }

  if (
    pathWithoutLocale === "/" ||
    pathWithoutLocale === "" ||
    isAdminHostMarketingPath(pathWithoutLocale) ||
    isAdminHostTenantPath(pathWithoutLocale)
  ) {
    return {
      action: "redirect",
      targetPath: resolvePlatformAdminLandingPath(locale),
      reason: "platform_admin_landing",
    };
  }

  return { action: "allow" };
}

/** API paths permitted on admin host (Access + app auth apply separately). */
export function isAdminHostAllowedApiPath(pathname: string): boolean {
  if (pathname === "/api/v1/health") return true;
  return isPlatformAdminApiPath(pathname);
}

export function isAdminHostBlockedApiPath(
  host: string | null | undefined,
  pathname: string
): boolean {
  if (!pathname.startsWith("/api/v1")) return false;
  if (!isPlatformAdminHost(host)) return false;
  return !isAdminHostAllowedApiPath(pathname);
}
