/**
 * Patches the wrangler bundle (worker-bootstrap.js) to replace the
 * __require that throws on dynamic require with a wrapper that stubs
 * middleware-manifest.json. Run after: wrangler deploy --dry-run --outdir .open-next/deploy
 *
 * Patches .open-next/deploy/worker-bootstrap.js
 */

const fs = require("fs");
const path = require("path");

const bundlePath = path.join(__dirname, "..", ".open-next", "deploy", "worker-bootstrap.js");
if (!fs.existsSync(bundlePath)) {
  console.warn("patch-bundle-require: bundle not found (run wrangler deploy --dry-run --outdir .open-next/deploy first), skip");
  process.exit(0);
}

let code = fs.readFileSync(bundlePath, "utf8");

// Full assignment in formatted bundle (with spaces and /* @__PURE__ */)
const original =
  `var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});`;

const replacement =
  `var __require = function(x) {
  if (typeof x === "string" && x.includes("middleware") && x.includes("manifest")) return { version: 3, middleware: {}, functions: {}, sortedMiddleware: [] };
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
};`;

if (!code.includes(original)) {
  // Minified variant
  const minOriginal = 'var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, { get: (a, b) => (typeof require !== "undefined" ? require : a)[b] }) : x)(function(x) { if (typeof require !== "undefined") return require.apply(this, arguments); throw Error(\'Dynamic require of "\' + x + \'" is not supported\'); });';
  if (code.includes(minOriginal)) {
    code = code.replace(minOriginal, replacement.replace(/\n/g, " "));
  } else {
    console.warn("patch-bundle-require: __require pattern not found in bundle, skip");
    process.exit(0);
  }
} else {
  code = code.replace(original, replacement);
}

fs.writeFileSync(bundlePath, code, "utf8");
console.log("patch-bundle-require: patched worker-bootstrap.js (stub middleware-manifest in __require)");
