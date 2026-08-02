/** Security headers — single source of truth for middleware (pages + API) and next.config (static only). */

export type SecurityHeader = { readonly key: string; readonly value: string };

export type SecurityHeaderProfile = "page" | "api" | "static";

const BASE_CSP_DIRECTIVES = [
  "default-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "frame-ancestors 'none'",
] as const;

function buildScriptSrcDirective(isDevelopment: boolean): string {
  return isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co"
    : "script-src 'self' 'unsafe-inline' https://*.supabase.co";
}

export function buildCspValue(isDevelopment: boolean): string {
  return [...BASE_CSP_DIRECTIVES, buildScriptSrcDirective(isDevelopment)].join("; ") + ";";
}

/** HTML/document routes: full CSP + frame denial. Owned by middleware. */
export function getPageSecurityHeaders(isDevelopment = process.env.NODE_ENV === "development"): SecurityHeader[] {
  const cspValue = buildCspValue(isDevelopment);
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: cspValue },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ];
}

/** JSON/API routes: hardening without document CSP. Owned by middleware. */
export function getApiSecurityHeaders(): SecurityHeader[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ];
}

/**
 * Static assets (/_next/*, favicon, public images) excluded from middleware matcher.
 * Owned exclusively by next.config.js headers() with narrow sources — no CSP/auth/cache mutation.
 */
export function getStaticSecurityHeaders(): SecurityHeader[] {
  return [{ key: "X-Content-Type-Options", value: "nosniff" }];
}

/** @deprecated Use getPageSecurityHeaders — kept for tests and CJS shim. */
export function getSecurityHeaders(isDevelopment = process.env.NODE_ENV === "development"): SecurityHeader[] {
  return getPageSecurityHeaders(isDevelopment);
}

export const SECURITY_HEADERS = getPageSecurityHeaders();

export const REQUIRED_PAGE_SECURITY_HEADER_KEYS = [
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-Frame-Options",
  "Content-Security-Policy",
  "Permissions-Policy",
] as const;

export const REQUIRED_API_SECURITY_HEADER_KEYS = [
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-Frame-Options",
  "Permissions-Policy",
] as const;

export const REQUIRED_STATIC_SECURITY_HEADER_KEYS = ["X-Content-Type-Options"] as const;

/** @deprecated Use REQUIRED_PAGE_SECURITY_HEADER_KEYS */
export const REQUIRED_SECURITY_HEADER_KEYS = REQUIRED_PAGE_SECURITY_HEADER_KEYS;

export const HSTS_HEADER = "Strict-Transport-Security";
export const HSTS_VALUE = "max-age=31536000; includeSubdomains; preload";

/** Narrow next.config sources that must never overlap middleware page/API matchers. */
export const STATIC_SECURITY_HEADER_SOURCES = [
  "/_next/:path*",
  "/favicon.ico",
  "/:path*.svg",
  "/:path*.png",
  "/:path*.jpg",
  "/:path*.jpeg",
  "/:path*.gif",
  "/:path*.webp",
] as const;

export function getHeadersForProfile(
  profile: SecurityHeaderProfile,
  options?: { isDevelopment?: boolean }
): SecurityHeader[] {
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV === "development";
  switch (profile) {
    case "page":
      return getPageSecurityHeaders(isDevelopment);
    case "api":
      return getApiSecurityHeaders();
    case "static":
      return getStaticSecurityHeaders();
    default: {
      const _exhaustive: never = profile;
      return _exhaustive;
    }
  }
}

export function applySecurityHeadersToResponse(
  res: Response,
  profile: SecurityHeaderProfile,
  options?: { isProduction?: boolean; isDevelopment?: boolean }
): Response {
  const isProduction = options?.isProduction ?? process.env.NODE_ENV === "production";
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV === "development";
  getHeadersForProfile(profile, { isDevelopment }).forEach(({ key, value }) => res.headers.set(key, value));
  if (isProduction) {
    res.headers.set(HSTS_HEADER, HSTS_VALUE);
  }
  return res;
}

/** Apply API hardening headers without document CSP (middleware short-circuit + OpenNext fallback). */
export function applyApiSecurityHeadersToHeaders(
  headers: Headers,
  options?: { isProduction?: boolean }
): void {
  getApiSecurityHeaders().forEach(({ key, value }) => headers.set(key, value));
  const isProduction = options?.isProduction ?? process.env.NODE_ENV === "production";
  if (isProduction) {
    headers.set(HSTS_HEADER, HSTS_VALUE);
  }
}

/** Build next.config headers() entries for static-only ownership (no page/API sources). */
export function buildNextConfigStaticHeaderRules(options?: {
  isProduction?: boolean;
}): Array<{ source: string; headers: SecurityHeader[] }> {
  const isProduction = options?.isProduction ?? process.env.NODE_ENV === "production";
  const headers = [...getStaticSecurityHeaders()];
  if (isProduction) {
    headers.push({ key: HSTS_HEADER, value: HSTS_VALUE });
  }
  return STATIC_SECURITY_HEADER_SOURCES.map((source) => ({ source, headers }));
}

/**
 * OpenNext/Workers can merge middleware + origin security headers into a single
 * comma-joined line (`nosniff, nosniff`). Collapse only when the full value is
 * an identical repeat — never invent a weaker policy from a conflicting join.
 */
export const COLLAPSIBLE_SECURITY_HEADER_NAMES = [
  "x-content-type-options",
  "referrer-policy",
  "x-frame-options",
  "permissions-policy",
  "content-security-policy",
  "strict-transport-security",
] as const;

export function collapseDuplicateSecurityHeaderValue(value: string): string {
  const v = value.trim();
  const sep = ", ";
  if (!v.includes(sep)) return v;

  let idx = v.indexOf(sep);
  while (idx !== -1) {
    const left = v.slice(0, idx);
    if (left.length > 0) {
      let rest = v;
      let copies = 0;
      let ok = true;
      while (rest.length > 0) {
        if (rest === left) {
          copies += 1;
          break;
        }
        if (rest.startsWith(left + sep)) {
          copies += 1;
          rest = rest.slice(left.length + sep.length);
          continue;
        }
        ok = false;
        break;
      }
      if (ok && copies >= 2) return left;
    }
    idx = v.indexOf(sep, idx + 1);
  }
  return v;
}

/** Rewrite response headers that OpenNext duplicated without changing unequal joins. */
export function collapseDuplicatedSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  let changed = false;
  for (const name of COLLAPSIBLE_SECURITY_HEADER_NAMES) {
    const current = headers.get(name);
    if (!current) continue;
    const collapsed = collapseDuplicateSecurityHeaderValue(current);
    if (collapsed !== current) {
      headers.set(name, collapsed);
      changed = true;
    }
  }
  if (!changed) return response;
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
