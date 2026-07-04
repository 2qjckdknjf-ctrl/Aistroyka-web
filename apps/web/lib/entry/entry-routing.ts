/**
 * Entry routing policy and resolution for post-auth / post-login flows.
 * Step 9: post-signup / post-login entry routing polish.
 *
 * Policy:
 * - Explicit safe next route wins (when valid and internal).
 * - Otherwise → dashboard entry (OnboardingGate decides shell vs content).
 * - No open redirects; next param is sanitized.
 * - Legacy operational workspaces continue to dashboard via OnboardingGate.
 */

import { routing } from "@/i18n/routing";

const LOCALES = routing.locales as readonly string[];
const DEFAULT_LOCALE = routing.defaultLocale;

/** Allowed path prefixes for next param (without leading locale). Must be internal app routes. */
const SAFE_PATH_PREFIXES = [
  "/dashboard",
  "/portal",
  "/projects",
  "/portfolio",
  "/team",
  "/settings",
  "/invite",
  "/billing",
  "/subscribe",
  "/admin",
  "/platform-admin",
  "/owner",
] as const;

/** Regex: path starts with /{locale}/ where locale is valid */
function hasValidLocalePrefix(pathname: string): boolean {
  return LOCALES.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`));
}

/** Check path (without locale) is under a safe prefix */
function isSafePathWithoutLocale(path: string): boolean {
  return SAFE_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Sanitizes a `next` param to prevent open redirects.
 * Returns a safe internal path (pathname + search) or null if invalid.
 *
 * Rules:
 * - Rejects protocol-relative (//), external URLs, non-path strings.
 * - Resolved URL must stay same-origin.
 * - Path must be under a safe prefix; locale may be present or will be added.
 */
export function sanitizeNextRoute(
  next: string | null | undefined,
  baseUrl: string,
  locale?: string
): string | null {
  if (next == null || typeof next !== "string") return null;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\")) return null;

  try {
    const base = new URL(baseUrl);
    const resolved = new URL(trimmed, base);
    if (resolved.origin !== base.origin) return null;
    const pathname = resolved.pathname;
    if (!pathname.startsWith("/")) return null;

    if (hasValidLocalePrefix(pathname)) {
      const withoutLocale = pathname.replace(/^\/(ru|en|es|it)(?=\/|$)/, "") || "/";
      if (!isSafePathWithoutLocale(withoutLocale)) return null;
      return pathname + resolved.search;
    }

    const pathWithoutLocale = pathname.startsWith("/") ? pathname : `/${pathname}`;
    if (!isSafePathWithoutLocale(pathWithoutLocale)) return null;
    const validLocale = locale && LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
    return `/${validLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}` + resolved.search;
  } catch {
    return null;
  }
}

export type EntryReason =
  | "explicit_next"
  | "default_dashboard"
  | "fallback_dashboard";

export type ResolvePostAuthEntryResult = {
  path: string;
  reason: EntryReason;
  nextPreserved: boolean;
  onboardingShellExpected?: boolean;
};

/**
 * Resolves the post-auth entry route.
 * Used by middleware and login page for redirect target.
 *
 * - If next is valid and safe → use it (explicit_next).
 * - Otherwise → dashboard for locale (default_dashboard).
 * - Fallback → dashboard (fallback_dashboard).
 *
 * Note: Orchestration/OnboardingGate runs client-side after landing.
 * This resolver only decides the redirect target; it does not fetch orchestration.
 */
export function resolvePostAuthEntry(params: {
  locale: string;
  next?: string | null;
  baseUrl: string;
}): ResolvePostAuthEntryResult {
  const { locale, next, baseUrl } = params;
  const validLocale = LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
  const defaultPath = `/${validLocale}/dashboard`;

  const sanitized = sanitizeNextRoute(next ?? null, baseUrl, locale);
  if (sanitized) {
    return {
      path: sanitized,
      reason: "explicit_next",
      nextPreserved: true,
      onboardingShellExpected: sanitized.includes("/dashboard"),
    };
  }

  return {
    path: defaultPath,
    reason: "default_dashboard",
    nextPreserved: false,
    onboardingShellExpected: true,
  };
}
