# Phase 7.7.3 — Smoke Green Report

**Date:** 2026-03-06  
**Goal:** Make pilot_launch smoke green against a real running instance; fix cron-tick HTTP 500 if it persists.

---

## Environment used

- **Instance:** Local (http://localhost:3000). Dev server and production build were used for checks.
- **Env vars (sanitized):** BASE_URL=http://localhost:3000; CRON_SECRET, COOKIE, AUTH_HEADER not set (optional).

---

## Commands run

```bash
# Stage 0 — Check listener and health
lsof -nP -iTCP:3000 -sTCP:LISTEN
curl -sS -o /dev/null -w "%{http_code}" -m 3 http://127.0.0.1:3000/api/v1/health

# Start dev server (background)
cd apps/web && bun run dev

# Wait for server (loop 20 x 0.5s)
for i in $(seq 1 20); do curl -sS -o /dev/null -w "%{http_code}" -m 2 http://127.0.0.1:3000/api/v1/health; sleep 0.5; done

# Cron-tick verbose (debug 500)
curl -sS -i -X POST -H "Content-Type: application/json" http://127.0.0.1:3000/api/v1/admin/jobs/cron-tick -m 10

# Smoke (full)
BASE_URL=http://localhost:3000 ./scripts/smoke/pilot_launch.sh

# Gates
cd apps/web && bun run test -- --run
cd apps/web && bun run cf:build
```

---

## Outputs (sanitized)

**Health (no Supabase env):** HTTP 503 (expected: missing_supabase_env or db error).

**Cron-tick (when route ran correctly):** HTTP 503, body `{"ok":false,"error":"Admin client not configured","error_code":"admin_not_configured"}`.

**Cron-tick (when 500 observed):** HTTP 500, response body was HTML error page. Server logs showed:
```
Error: Cannot find module './chunks/vendor-chunks/next.js'
Require stack: .../app/api/v1/admin/jobs/cron-tick/route.js ...
```
Same error when hitting ops/metrics (Next.js dev server loading issue).

**Smoke run (local, no CRON_SECRET/COOKIE/AUTH_HEADER):**
```
Pilot launch smoke: http://localhost:3000 (from=2026-02-27 to=2026-03-06)
  FAIL: cron-tick → HTTP 500
  FAIL: ops/metrics → HTTP 500 (set COOKIE or AUTH_HEADER for tenant auth)
```

**Gates:**
- `bun run test -- --run`: 76 files, 358 tests passed.
- `bun run cf:build`: success (OpenNext Cloudflare, worker saved).

---

## Root cause for cron-tick 500

- **Application path:** When the cron-tick route executed normally (e.g. before a dev recompile), it returned **503** with `admin_not_configured` (no SUPABASE_SERVICE_ROLE_KEY). So the handler did not return 500.
- **Observed 500:** The HTTP 500 seen in smoke came from the **Next.js dev server**, not from the cron-tick handler: after recompile, the dev server threw `MODULE_NOT_FOUND` for `./chunks/vendor-chunks/next.js` while loading the route. That triggers Next’s generic 500 error page. Same failure affected ops/metrics (tenant-scoped, would be 401 without auth when the app runs correctly).

---

## Fix applied

1. **Cron-tick fail-safe (no 500 from handler):**
   - `getAdminClient()` null → already returned 503; added `error_code: "admin_not_configured"`.
   - Tenants query: use `{ data, error }` from Supabase; on `error` return 503 with `error_code: "cron_tick_error"`.
   - Per-tenant enqueue: wrapped in try/catch so one tenant failure does not kill the tick.
   - Outer try/catch: any unhandled exception in the handler returns 503 with `{ ok: false, error: "Cron tick failed", error_code: "cron_tick_error" }` instead of 500.

2. **Unit test:** Added a test that when `processJobs` throws, the route responds with 503 and `error_code: "cron_tick_error"` (no 500).

3. **Script:** `pilot_launch.sh` already supports AUTH_HEADER for ops/metrics; no change required.

---

## Final smoke green condition

To get **green** pilot_launch:

1. **Instance:** Use a **stable** instance (production/staging deploy, or local `bun run start` after `bun run build`). If using `bun run dev`, restart the dev server if you see MODULE_NOT_FOUND 500s.
2. **Config:** Set Supabase env (and CRON_SECRET if REQUIRE_CRON_SECRET=true) so cron-tick can return 200 with ok:true.
3. **Metrics auth:** Set COOKIE or AUTH_HEADER so GET /api/v1/ops/metrics returns 200 (tenant-scoped).

Example (sanitized):
```bash
BASE_URL=https://staging.example.com CRON_SECRET=*** COOKIE="sb-***=***" ./scripts/smoke/pilot_launch.sh
# or
BASE_URL=http://localhost:3000 AUTH_HEADER="Bearer ***" ./scripts/smoke/pilot_launch.sh
```

Expected when green:
```
Pilot launch smoke: ... (from=... to=...)
  PASS: cron-tick
  PASS: ops/metrics
  Counters: uploads_stuck=0 ...
  pilot_launch done
```

---

## Migration history (optional)

If DATABASE_URL or SUPABASE_DB_URL is set and staging/prod already has old migration versions (20260307*, 20260308*, 20260309*) in `supabase_migrations.schema_migrations`, run (do not run automatically; exact command for operator):

```bash
psql "$DATABASE_URL" -f scripts/db/remap_migration_versions_phase7_7_1.sql
```

Do not print or commit connection strings.
