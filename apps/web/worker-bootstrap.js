/**
 * Entry point for Cloudflare Worker. Runs before any other code so that
 * globalThis.require is overridden to stub middleware-manifest.json (dynamic
 * require not supported on Workers). Use dynamic import() so this IIFE runs
 * before the worker (and handler) are loaded; static import would be hoisted first.
 *
 * Also applies API security headers (OpenNext bypasses middleware for most /api/v1/*)
 * and collapses identical OpenNext-duplicated page security header values.
 * Keep collapse logic in sync with apps/web/lib/security-headers.ts.
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
    const withApi = withApiSecurityHeaders(response, pathname);
    return collapseDuplicatedSecurityHeaders(withApi);
  },
};
