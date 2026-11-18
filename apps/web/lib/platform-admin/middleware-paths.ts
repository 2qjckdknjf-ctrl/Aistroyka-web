import { PLATFORM_ADMIN_BASE_PATH, LEGACY_OWNER_API_PREFIX, PLATFORM_API_PREFIX } from "./constants";

export function isPlatformAdminPagePath(pathWithoutLocale: string): boolean {
  return (
    pathWithoutLocale.startsWith("/owner") || pathWithoutLocale.startsWith(PLATFORM_ADMIN_BASE_PATH)
  );
}

export function isPlatformAdminApiPath(pathname: string): boolean {
  return pathname.startsWith(LEGACY_OWNER_API_PREFIX) || pathname.startsWith(PLATFORM_API_PREFIX);
}

/** Cloudflare worker middleware bypass exception paths. */
export const PLATFORM_API_MIDDLEWARE_EXCEPTION_PATHS = [
  LEGACY_OWNER_API_PREFIX,
  PLATFORM_API_PREFIX,
] as const;

export function shouldBypassApiMiddleware(pathname: string): boolean {
  if (!pathname.startsWith("/api/v1/")) return false;
  return !PLATFORM_API_MIDDLEWARE_EXCEPTION_PATHS.some((prefix) => pathname.startsWith(prefix));
}
