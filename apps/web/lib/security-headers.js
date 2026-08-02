/** CJS shim for next.config.js. Keep in sync with security-headers.ts.
 * Page/API headers: middleware only.
 * Static headers: next.config.js via buildNextConfigStaticHeaderRules only.
 */
const BASE_CSP_DIRECTIVES = [
  "default-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "img-src 'self' data: https:",
  "style-src 'self' 'unsafe-inline'",
  "frame-ancestors 'none'",
];

function buildScriptSrcDirective(isDevelopment) {
  return isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co"
    : "script-src 'self' 'unsafe-inline' https://*.supabase.co";
}

function buildCspValue(isDevelopment) {
  return [...BASE_CSP_DIRECTIVES, buildScriptSrcDirective(isDevelopment)].join("; ") + ";";
}

function getPageSecurityHeaders(isDevelopment = process.env.NODE_ENV === "development") {
  const cspValue = buildCspValue(isDevelopment);
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Content-Security-Policy", value: cspValue },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ];
}

function getApiSecurityHeaders() {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ];
}

function getStaticSecurityHeaders() {
  return [{ key: "X-Content-Type-Options", value: "nosniff" }];
}

function getSecurityHeaders(isDevelopment = process.env.NODE_ENV === "development") {
  return getPageSecurityHeaders(isDevelopment);
}

const SECURITY_HEADERS = getPageSecurityHeaders();
const REQUIRED_PAGE_SECURITY_HEADER_KEYS = [
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-Frame-Options",
  "Content-Security-Policy",
  "Permissions-Policy",
];
const REQUIRED_API_SECURITY_HEADER_KEYS = [
  "X-Content-Type-Options",
  "Referrer-Policy",
  "X-Frame-Options",
  "Permissions-Policy",
];
const REQUIRED_STATIC_SECURITY_HEADER_KEYS = ["X-Content-Type-Options"];
const REQUIRED_SECURITY_HEADER_KEYS = REQUIRED_PAGE_SECURITY_HEADER_KEYS;

const HSTS_HEADER = "Strict-Transport-Security";
const HSTS_VALUE = "max-age=31536000; includeSubdomains; preload";

const STATIC_SECURITY_HEADER_SOURCES = [
  "/_next/:path*",
  "/favicon.ico",
  "/:path*.svg",
  "/:path*.png",
  "/:path*.jpg",
  "/:path*.jpeg",
  "/:path*.gif",
  "/:path*.webp",
];

function getHeadersForProfile(profile, options) {
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV === "development";
  switch (profile) {
    case "page":
      return getPageSecurityHeaders(isDevelopment);
    case "api":
      return getApiSecurityHeaders();
    case "static":
      return getStaticSecurityHeaders();
    default:
      throw new Error(`Unknown security header profile: ${profile}`);
  }
}

function applySecurityHeadersToResponse(res, profile, options) {
  const isProduction = options?.isProduction ?? process.env.NODE_ENV === "production";
  const isDevelopment = options?.isDevelopment ?? process.env.NODE_ENV === "development";
  getHeadersForProfile(profile, { isDevelopment }).forEach(({ key, value }) => res.headers.set(key, value));
  if (isProduction) {
    res.headers.set(HSTS_HEADER, HSTS_VALUE);
  }
  return res;
}

function applyApiSecurityHeadersToHeaders(headers, options) {
  getApiSecurityHeaders().forEach(({ key, value }) => headers.set(key, value));
  const isProduction = options?.isProduction ?? process.env.NODE_ENV === "production";
  if (isProduction) {
    headers.set(HSTS_HEADER, HSTS_VALUE);
  }
}

function buildNextConfigStaticHeaderRules(options) {
  const isProduction = options?.isProduction ?? process.env.NODE_ENV === "production";
  const headers = [...getStaticSecurityHeaders()];
  if (isProduction) {
    headers.push({ key: HSTS_HEADER, value: HSTS_VALUE });
  }
  return STATIC_SECURITY_HEADER_SOURCES.map((source) => ({ source, headers }));
}

const COLLAPSIBLE_SECURITY_HEADER_NAMES = [
  "x-content-type-options",
  "referrer-policy",
  "x-frame-options",
  "permissions-policy",
  "content-security-policy",
  "strict-transport-security",
];

function collapseDuplicateSecurityHeaderValue(value) {
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

function collapseDuplicatedSecurityHeaders(response) {
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

module.exports = {
  SECURITY_HEADERS,
  REQUIRED_SECURITY_HEADER_KEYS,
  REQUIRED_PAGE_SECURITY_HEADER_KEYS,
  REQUIRED_API_SECURITY_HEADER_KEYS,
  REQUIRED_STATIC_SECURITY_HEADER_KEYS,
  HSTS_HEADER,
  HSTS_VALUE,
  STATIC_SECURITY_HEADER_SOURCES,
  COLLAPSIBLE_SECURITY_HEADER_NAMES,
  buildCspValue,
  getSecurityHeaders,
  getPageSecurityHeaders,
  getApiSecurityHeaders,
  getStaticSecurityHeaders,
  getHeadersForProfile,
  applySecurityHeadersToResponse,
  applyApiSecurityHeadersToHeaders,
  buildNextConfigStaticHeaderRules,
  collapseDuplicateSecurityHeaderValue,
  collapseDuplicatedSecurityHeaders,
};
