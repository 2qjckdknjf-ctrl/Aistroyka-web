# Edge Performance Audit Report

**Project:** AISTROYKA-WEB  
**Date:** 2026-02-23  
**Target:** Cloudflare Worker edge performance (no business logic changes)

---

## 1. Bundle Size Overview

| Artifact | Size | Notes |
|----------|------|--------|
| **.open-next total** | ~22 MB | Full OpenNext output (includes cache, templates). |
| **server-functions** | ~20 MB | Server bundle (default worker + RSC). Loaded by Worker at cold start. |
| **middleware** | ~496 KB | Edge middleware bundle. |
| **assets** | ~992 KB | Static assets (JS/CSS chunks). Served from Workers Assets. |
| **worker.js** | ~2.6 KB | Bootstrap entry; delegates to server bundle. |
| **Next build — First Load JS shared** | 87.2 kB | Shared chunks (e.g. 31.6 kB + 53.6 kB + 1.95 kB). |
| **Next build — Middleware** | 74.4 kB | Middleware bundle in Next output. |
| **Total Upload (Wrangler)** | 3964 KiB (gzip: ~832 KiB) | Assets + worker. |

Largest cost: **server-functions** (~20 MB) drives cold start; middleware and client bundles are moderate.

---

## 2. Heavy Dependencies

**Production dependencies (package.json):**

| Package | Role | Edge impact |
|---------|------|-------------|
| **next** | 14.2.18 | High — core runtime; required. |
| **@opennextjs/cloudflare** | ^1.16.4 | High — adapts Next to Workers; required. |
| **@supabase/ssr** | ^0.5.2 | Medium — auth/session in middleware and server. |
| **@supabase/supabase-js** | ^2.47.10 | Medium — client and server Supabase API. |
| **react** / **react-dom** | ^18.3.1 | Medium — used in RSC and client. |

No optional heavy libs (e.g. moment, lodash, chart libs) in dependencies. **Unused heavy libraries:** none identified; dependency set is minimal.

---

## 3. Cold Start Risk

| Check | Result |
|-------|--------|
| **Large top-level imports** | Middleware and server adapter import only `next/server`, `@supabase/ssr`, `@/lib/env`, `@/lib/app-url`. No large static data or heavy SDKs at top level. |
| **Dynamic imports** | Not used in middleware or server adapter. Server client is created per-request (no global singleton); Supabase client is created inside `createClient()` / `updateSession()` each time. |
| **Supabase client** | **Created lazily per request** in `lib/supabase/server.ts` (`createClient()` async) and `lib/supabase/middleware.ts` (inside `updateSession()`). No long-lived client at module scope. |

**Main cold start cost:** Size of the server-functions bundle (~20 MB) and Worker initialization. Supabase and app code are request-scoped; no extra heavy module-level work identified.

---

## 4. Edge Runtime Compatibility

| Check | Result |
|-------|--------|
| **Node-only imports (fs, path)** | **None** in app/lib/middleware. No `from "fs"`, `from "path"`, or `require("fs")`/`require("path")` in `.ts`/`.tsx`. |
| **Large JSON imports** | No `import x from "*.json"` or `require("*.json")` in app or lib. API routes use `NextResponse.json()` or `request.json()` (runtime payloads only). |
| **Middleware imports** | `next/server`, `@/lib/supabase/middleware`, `@/lib/app-url`. All edge-compatible. |
| **Supabase adapter imports** | `@supabase/ssr`, `next/server`, `next/headers`, `@/lib/env`. No Node-only APIs. |

**Conclusion:** Edge runtime compatible; no heavy Node-only or large static JSON in middleware/server paths.

---

## 5. Performance Risks

| Risk | Level | Notes |
|------|--------|--------|
| **Server bundle size (~20 MB)** | Medium | Dominates cold start; constrained by Next + OpenNext architecture. |
| **Middleware size (74–496 KB)** | Low | Reasonable for auth + headers. |
| **Console / debug in edge** | None | No `console.log`/`console.warn`/etc. in app/lib/middleware `.ts`/`.tsx`. |
| **Synchronous heavy work at top level** | None | No large sync init in middleware or server adapter. |
| **Duplicate Supabase client creation** | Low | Per-request creation is correct for SSR; no unnecessary double creation in same request path. |

---

## 6. Immediate Optimizations (max 5)

1. **Keep dependency set minimal** — Avoid adding heavy client or server libs (e.g. full lodash, moment, large UI kits). Use tree-shakeable or lightweight alternatives if needed.
2. **Monitor cold start** — Use Cloudflare Workers analytics and `wrangler tail` to observe cold start and P99; if needed, consider OpenNext/Next updates that reduce server bundle size.
3. **Ensure no accidental Node APIs** — Keep current policy: no `fs`/`path` in app/lib; use only edge-safe APIs and env.
4. **Lazy load heavy client components** — For future large client components, use `next/dynamic` with `ssr: false` where appropriate to keep initial client bundle smaller.
5. **Review OpenNext/Next upgrades** — When upgrading Next or OpenNext, check release notes for Worker bundle size and cold start improvements.

---

## 7. Build Status

- **Command:** `bun run cf:build`
- **Result:** **Success.** Next.js build and OpenNext Cloudflare bundle completed; worker and assets generated under `.open-next/`.

---

## 8. Deploy Status

- **Command:** `bun run cf:deploy`
- **Result:** **Success.** Assets uploaded (Total Upload: 3964.11 KiB, gzip: ~832 KiB); worker deployed.
- **Worker:** aistroyka-web  
- **URL:** https://aistroyka-web.z6pxn548dk.workers.dev  

---

*End of report. File: edge-performance-audit-report.md*
