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

const workerModule = await import("./.open-next/worker.js");
export default workerModule.default;
