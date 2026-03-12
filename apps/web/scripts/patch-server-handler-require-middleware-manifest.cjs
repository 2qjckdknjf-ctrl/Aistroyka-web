/**
 * Post-build patch: stub dynamic require of middleware-manifest.json in the
 * server handler so Cloudflare Workers (which don't support dynamic require)
 * don't throw. Next.js server code may try to load this manifest; we return
 * a minimal valid shape so the request path continues.
 *
 * Patches .open-next/server-functions/default/handler.mjs
 */

const fs = require("fs");
const path = require("path");

const handlerPath = path.join(__dirname, "..", ".open-next", "server-functions", "default", "handler.mjs");
if (!fs.existsSync(handlerPath)) {
  console.warn("patch-server-handler-require-middleware-manifest: handler.mjs not found, skip");
  process.exit(0);
}

let code = fs.readFileSync(handlerPath, "utf8");

// We need __require to always check path first (stub middleware-manifest), then fall back to require. OpenNext may emit either:
// (A) __require=(x=>typeof require<"u"?require:...)(inner) — then __require becomes native require when present.
// (B) __require=(function(x){if(typeof require<"u")...throw...}); — direct form, still no path check.
const directWrapper =
  "__require=function(x){if(typeof x===\"string\"&&x.includes(\"middleware\")&&x.includes(\"manifest\"))return{version:3,middleware:{},functions:{},sortedMiddleware:[]};if(typeof require<\"u\")return require.apply(this,arguments);throw Error('Dynamic require of \"'+x+'\" is not supported')};";

if (code.includes("__require=function(x){if(typeof x===\"string\"&&x.includes(\"middleware\")")) {
  console.log("patch-server-handler-require-middleware-manifest: already patched (direct __require), skip");
  process.exit(0);
}

// Pattern (B): direct (function(x){...}); with throw-only body
const directThrowOnly =
  "__require=(function(x){if(typeof require<\"u\")return require.apply(this,arguments);throw Error('Dynamic require of \"'+x+'\" is not supported')});";
if (code.includes(directThrowOnly)) {
  code = code.replace(directThrowOnly, directWrapper);
} else {
  // Pattern (A): full assignment with outer wrapper
  const fullAssignment =
    "__require=(x=>typeof require<\"u\"?require:typeof Proxy<\"u\"?new Proxy(x,{get:(a,b)=>(typeof require<\"u\"?require:a)[b]}):x)(function(x){if(typeof require<\"u\")return require.apply(this,arguments);throw Error('Dynamic require of \"'+x+'\" is not supported')});";
  if (code.includes(fullAssignment)) {
    code = code.replace(fullAssignment, directWrapper);
  } else {
    const outerWrapper =
      "__require=(x=>typeof require<\"u\"?require:typeof Proxy<\"u\"?new Proxy(x,{get:(a,b)=>(typeof require<\"u\"?require:a)[b]}):x)(";
    const innerThrowOnly =
      "(function(x){if(typeof require<\"u\")return require.apply(this,arguments);throw Error('Dynamic require of \"'+x+'\" is not supported')});";
    const innerStub =
      "function(x){if(typeof x===\"string\"&&x.includes(\"middleware\")&&x.includes(\"manifest\"))return{version:3,middleware:{},functions:{},sortedMiddleware:[]};if(typeof require<\"u\")return require.apply(this,arguments);throw Error('Dynamic require of \"'+x+'\" is not supported')};";
    if (code.includes(outerWrapper) && code.includes(innerThrowOnly)) {
      code = code.replace(outerWrapper, "__require=").replace(innerThrowOnly, innerStub);
    } else {
      console.warn("patch-server-handler-require-middleware-manifest: __require pattern not found (format may have changed), skip");
      process.exit(0);
    }
  }
}

// Also stub global require at top of handler so runtime require() is caught (runs when module loads)
const topMarker = "import {setInterval, clearInterval, setTimeout, clearTimeout} from \"node:timers\"";
const topStub = `import {setInterval, clearInterval, setTimeout, clearTimeout} from "node:timers";
(function(){if(typeof globalThis.require==="function"){const _r=globalThis.require;globalThis.require=function(id){if(typeof id==="string"&&id.includes("middleware-manifest"))return{version:3,middleware:{},functions:{},sortedMiddleware:[]};return _r.apply(this,arguments);};}})();
`;
if (code.startsWith(topMarker) && !code.includes("globalThis.require=function(id)")) {
  code = code.replace(topMarker, topStub);
}

fs.writeFileSync(handlerPath, code, "utf8");
console.log("patch-server-handler-require-middleware-manifest: patched handler.mjs (stub middleware-manifest require)");
