/** CJS shim for next.config.js (Node require does not load .ts). Keep in sync with security-headers.ts. */
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
const REQUIRED_SECURITY_HEADER_KEYS = REQUIRED_PAGE_SECURITY_HEADER_KEYS;

module.exports = {
  SECURITY_HEADERS,
  REQUIRED_SECURITY_HEADER_KEYS,
  REQUIRED_PAGE_SECURITY_HEADER_KEYS,
  REQUIRED_API_SECURITY_HEADER_KEYS,
  buildCspValue,
  getSecurityHeaders,
  getPageSecurityHeaders,
  getApiSecurityHeaders,
};
