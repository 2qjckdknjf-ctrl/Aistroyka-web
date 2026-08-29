/**
 * Security header values — single source of truth.
 * Page/HTML headers are applied only via next.config.js `headers()`.
 * API headers are applied via middleware short-circuits + worker-bootstrap.js.
 */

export type SecurityHeader = { readonly key: string; readonly value: string };

export type SecurityHeaderProfile = "page" | "api";

const BASE_CSP_DIRECTIVES = [
  "default-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://growth-os-sable-psi.vercel.app",
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

/** HTML/document routes: full CSP + frame denial. */
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

/** JSON/API routes: hardening without document CSP (avoids breaking clients). */
export function getApiSecurityHeaders(): SecurityHeader[] {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ];
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

/** @deprecated Use REQUIRED_PAGE_SECURITY_HEADER_KEYS */
export const REQUIRED_SECURITY_HEADER_KEYS = REQUIRED_PAGE_SECURITY_HEADER_KEYS;

const HSTS_HEADER = "Strict-Transport-Security";
const HSTS_VALUE = "max-age=31536000; includeSubdomains; preload";

export function applySecurityHeadersToResponse(
  res: Response,
  profile: SecurityHeaderProfile,
  options?: { isProduction?: boolean; isDevelopment?: boolean }
): Response {
  const isProduction = options?.isProduction ?? process.env.NODE_ENV === "production";
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV === "development";
  const headers = profile === "page" ? getPageSecurityHeaders(isDevelopment) : getApiSecurityHeaders();
  headers.forEach(({ key, value }) => res.headers.set(key, value));
  if (profile === "page" && isProduction) {
    res.headers.set(HSTS_HEADER, HSTS_VALUE);
  }
  return res;
}

/** Apply API hardening headers without document CSP (middleware short-circuit + OpenNext fallback). */
export function applyApiSecurityHeadersToHeaders(headers: Headers): void {
  getApiSecurityHeaders().forEach(({ key, value }) => headers.set(key, value));
}
