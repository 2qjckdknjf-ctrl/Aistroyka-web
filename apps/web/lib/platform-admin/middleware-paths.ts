import {
  PLATFORM_ADMIN_BASE_PATH,
  LEGACY_OWNER_API_PREFIX,
  PLATFORM_API_PREFIX,
  LEGACY_ADMIN_BILLING_API_PREFIX,
  LEGACY_ADMIN_LEADS_API_PREFIX,
} from "./constants";
import {
  PLATFORM_OWNER_API_PREFIXES,
  isPlatformOwnerMiddlewareApiPath,
  matchesSegmentPrefix,
  shouldBypassApiMiddleware as shouldBypassApiMiddlewareImpl,
} from "./platform-api-middleware-exceptions.cjs";

export function isPlatformAdminPagePath(pathWithoutLocale: string): boolean {
  return (
    pathWithoutLocale === "/owner" ||
    pathWithoutLocale.startsWith("/owner/") ||
    pathWithoutLocale === PLATFORM_ADMIN_BASE_PATH ||
    pathWithoutLocale.startsWith(`${PLATFORM_ADMIN_BASE_PATH}/`)
  );
}

/** Segment-safe platform-owner API namespaces (Next middleware + worker exceptions). */
export function isPlatformAdminApiPath(pathname: string): boolean {
  return isPlatformOwnerMiddlewareApiPath(pathname);
}

/** @deprecated Prefer PLATFORM_OWNER_API_PREFIXES from platform-api-middleware-exceptions.cjs */
export const PLATFORM_API_MIDDLEWARE_EXCEPTION_PATHS = PLATFORM_OWNER_API_PREFIXES;

export function shouldBypassApiMiddleware(pathname: string): boolean {
  return shouldBypassApiMiddlewareImpl(pathname);
}

export {
  matchesSegmentPrefix,
  LEGACY_OWNER_API_PREFIX,
  PLATFORM_API_PREFIX,
  LEGACY_ADMIN_BILLING_API_PREFIX,
  LEGACY_ADMIN_LEADS_API_PREFIX,
};
