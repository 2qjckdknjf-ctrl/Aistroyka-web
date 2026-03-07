# Production smoke green v3 — tail-based RCA

**Date:** 2026-03-07  
**Branch:** release/phase5-2-1  
**Goal:** GET /api/v1/health and POST /api/v1/admin/jobs/cron-tick return 200 or 503 (not 500); then ops/metrics 200 and pilot_launch.sh green.

---

## 1. Resource that serves aistroyka.ai

| Item | Value |
|------|--------|
| **Resource** | Cloudflare **Worker** |
| **Name** | `aistroyka-web-production` |
| **Config** | `apps/web/wrangler.toml` → `[env.production]`, `name = "aistroyka-web-production"` |
| **Entry** | `.open-next/worker.js` (OpenNext build output) |
| **Routes** | Managed in Cloudflare Dashboard (not in repo). |

**Verification:** `npx wrangler tail --env production --format json` was run; requests to `GET https://aistroyka.ai/api/v1/health` and `POST .../api/v1/admin/jobs/cron-tick` appeared in the tail with `scriptName: "aistroyka-web-production"`, confirming the domain is served by this Worker.

---

## 2. Root cause of 500 (from tail)

**Error in logs:**
```text
Error: Dynamic require of "/.next/server/middleware-manifest.json" is not supported
```

**Classification:** Runtime/API limitation on Cloudflare Workers — **dynamic `require()`** of that path is not supported. The failure occurs in the request path (middleware or server handler) before the app route handlers run, so every request to the Worker returns 500.

**Source:** Next.js server code (or OpenNext bundle) tries to load `middleware-manifest.json` at runtime; the Workers runtime throws for dynamic require of file paths.

---

## 3. Fixes attempted

1. **Worker bypass for /api/v1/***  
   Post-build patch (`scripts/patch-worker-bypass-api-middleware.cjs`): for `url.pathname.startsWith("/api/v1/")` the Worker skips the middleware handler and passes the request directly to the server handler. This avoids the crash in the **middleware** bundle but the **server** handler also triggers the same require.

2. **Stub `__require` in server handler**  
   Post-build patch (`scripts/patch-server-handler-require-middleware-manifest.cjs`): in `.open-next/server-functions/default/handler.mjs` the dynamic-require helper is patched so that when the requested path includes `middleware-manifest` or `middleware_manifest`, it returns a minimal stub object `{ version: 3, middleware: {}, functions: {}, sortedMiddleware: [] }` instead of throwing.  
   The patched handler is present on disk; the same error still appears in production tail, so either the deployed bundle does not use this patched file, or the failing `require` is the global one (e.g. nodejs_compat) and not the bundled `__require`.

3. **Stub global `require` in Worker**  
   In the Worker fetch callback, before other logic, `globalThis.require` is wrapped to return the same stub for paths containing `middleware-manifest`. Error persists in tail, so the require may run in a different context (e.g. inside the dynamically imported server handler) where this override is not visible.

4. **OpenNext upgrade**  
   `@opennextjs/cloudflare` was updated (e.g. to ^1.17.1). The middleware-manifest error is unchanged.

---

## 4. Env / secrets (names only)

Set for production Worker (e.g. via Dashboard or `wrangler secret put --env production`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`
- `OPENAI_API_KEY` (if used)

**Not set in this run (and required for cron-tick once 500 is fixed):**

- `SUPABASE_SERVICE_ROLE_KEY` — set manually from Supabase Dashboard → Project Settings → API → service_role, then `wrangler secret put SUPABASE_SERVICE_ROLE_KEY --env production`.
- `CRON_SECRET` — if cron-tick is protected by header/secret.

---

## 5. Final status

| Endpoint | Status | Notes |
|----------|--------|--------|
| GET /api/v1/health | **500** | Internal Server Error; tail shows middleware-manifest dynamic require error. |
| POST /api/v1/admin/jobs/cron-tick | **500** | Same cause. |
| GET /api/v1/ops/metrics | **Not tested** | Blocked by 500 on health/cron-tick. |
| pilot_launch.sh | **Not green** | Blocked by above. |

---

## 6. How to repeat smoke (after 500 is fixed)

**Required env (values not stored in repo):**

- `BASE_URL` — e.g. `https://aistroyka.ai`
- `CRON_SECRET` — same value as in production Worker secrets.
- `AUTH_HEADER` — `Authorization: Bearer <access_token>` for a user with access to ops/metrics (e.g. smoke manager; token from Supabase sign-in with anon key).

**Commands:**

1. Health: `curl -i https://aistroyka.ai/api/v1/health`
2. Cron-tick: `curl -i -X POST https://aistroyka.ai/api/v1/admin/jobs/cron-tick -H "content-type: application/json"` (and, if required, `-H "Authorization: Bearer <CRON_SECRET>"` or header used by the app).
3. Metrics: `curl -i "https://aistroyka.ai/api/v1/ops/metrics?from=2026-02-28&to=2026-03-07" -H "Authorization: Bearer <token>"`
4. Full smoke:  
   `BASE_URL=https://aistroyka.ai CRON_SECRET=<redacted> AUTH_HEADER="Authorization: Bearer <redacted>" ./scripts/smoke/pilot_launch.sh`

---

## 7. Single blocker

**Production stays 500** because the Worker (or its server handler) throws **“Dynamic require of \"/.next/server/middleware-manifest.json\" is not supported”** before any route handler runs. This must be resolved (e.g. by OpenNext/Next.js support for Workers, or by removing/avoiding middleware for API routes at build/runtime) before health, cron-tick, ops/metrics, and pilot_launch.sh can turn green.

---

## 8. Repo changes in this run

- **Post-build patches (no secrets):**
  - `apps/web/scripts/patch-worker-bypass-api-middleware.cjs` — bypass middleware for `/api/v1/*` and optional global-require stub.
  - `apps/web/scripts/patch-server-handler-require-middleware-manifest.cjs` — stub `__require` for middleware-manifest in server handler.
- **Build:** `apps/web/package.json` — `cf:build` runs both patches after `opennextjs-cloudflare build`.
- **Docs:** this file.
