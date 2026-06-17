/**
 * Entry point for Cloudflare Worker. Runs before any other code so that
 * globalThis.require is overridden to stub middleware-manifest.json (dynamic
 * require not supported on Workers). Use dynamic import() so this IIFE runs
 * before the worker (and handler) are loaded; static import would be hoisted first.
 */
(function () {
  if (typeof globalThis.require === "function") {
    const orig = globalThis.require;
    globalThis.require = function (id) {
      if (typeof id === "string" && id.includes("middleware") && id.includes("manifest")) {
        return { version: 3, middleware: {}, functions: {}, sortedMiddleware: [] };
      }
      return orig.apply(this, arguments);
    };
  }
})();

/** API hardening headers — OpenNext bypasses middleware for most /api/v1/* on Workers. */
const API_SECURITY_HEADERS = [
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-Frame-Options", "DENY"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()"],
];

function withApiSecurityHeaders(response, pathname) {
  if (!pathname.startsWith("/api/")) {
    return response;
  }
  const headers = new Headers(response.headers);
  for (const [key, value] of API_SECURITY_HEADERS) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const workerModule = await import("./.open-next/worker.js");
const inner = workerModule.default;

export default {
  ...inner,
  async fetch(request, env, ctx) {
    const response = await inner.fetch(request, env, ctx);
    const pathname = new URL(request.url).pathname;
    return withApiSecurityHeaders(response, pathname);
  },
};
