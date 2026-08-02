/**
 * Shared platform-owner API path prefixes for Next middleware classification
 * and Cloudflare worker middleware-bypass exceptions.
 *
 * Segment-safe: `/api/v1/platform` matches `/api/v1/platform` and `/api/v1/platform/...`
 * but not `/api/v1/platformish`.
 *
 * CommonJS so build-time patch scripts can require this module.
 */

/** @type {readonly string[]} */
const PLATFORM_OWNER_API_PREFIXES = Object.freeze([
  "/api/v1/owner",
  "/api/v1/platform",
  "/api/v1/admin/billing",
  "/api/v1/admin/leads",
]);

/**
 * @param {string} pathname
 * @param {string} prefix
 * @returns {boolean}
 */
function matchesSegmentPrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
function isPlatformOwnerMiddlewareApiPath(pathname) {
  return PLATFORM_OWNER_API_PREFIXES.some((prefix) => matchesSegmentPrefix(pathname, prefix));
}

/**
 * Worker / edge: bypass Next middleware for most /api/v1/* paths.
 * Returns true when middleware should be skipped.
 * @param {string} pathname
 * @returns {boolean}
 */
function shouldBypassApiMiddleware(pathname) {
  if (!pathname.startsWith("/api/v1/")) return false;
  return !isPlatformOwnerMiddlewareApiPath(pathname);
}

/**
 * Inline JS expression for worker.js patch (no require available in the Worker bundle).
 * @param {string} pathnameExpr e.g. "url.pathname"
 * @returns {string}
 */
function buildIsPlatformOwnerApiPathExpression(pathnameExpr) {
  return PLATFORM_OWNER_API_PREFIXES.map(
    (prefix) =>
      `(${pathnameExpr} === ${JSON.stringify(prefix)} || ${pathnameExpr}.startsWith(${JSON.stringify(`${prefix}/`)}))`
  ).join(" || ");
}

module.exports = {
  PLATFORM_OWNER_API_PREFIXES,
  matchesSegmentPrefix,
  isPlatformOwnerMiddlewareApiPath,
  shouldBypassApiMiddleware,
  buildIsPlatformOwnerApiPathExpression,
};
