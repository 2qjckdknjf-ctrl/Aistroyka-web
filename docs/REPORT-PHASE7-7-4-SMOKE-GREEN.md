# Phase 7.7.4 — Smoke Green + Dev Bundler Fix

**Date:** 2026-03-06  
**Goals:** (1) Make pilot_launch.sh green against a real instance; (2) Document and fix Next.js dev MODULE_NOT_FOUND.

---

## Target used

- **Chosen:** Local (fallback).
- **Reason:** BASE_URL was unset or pointed to localhost. Health check to localhost returned 503 (app up but DB/env not configured). Staging BASE_URL was not provided, so staging was not used.

---

## Required env checklist (cron-tick “admin configured”)

For cron-tick to return **200** with ok:true, the app must have:

| Env var | Purpose |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only). Required for getAdminClient(); when missing, cron-tick returns 503 with `error_code: admin_not_configured`. |

Optional:

- `REQUIRE_CRON_SECRET=true` → caller must send `x-cron-secret` matching `CRON_SECRET` or receive 403.

**Missing env to make local green:** Set the two vars above in `apps/web/.env.local` (do not commit). Then run `bun run build` and `bun run start` (or point BASE_URL at a staging/prod instance that already has them).

---

## Exact smoke command (no secrets)

```bash
BASE_URL=http://localhost:3000 ./scripts/smoke/pilot_launch.sh
# With optional auth for ops/metrics:
# CRON_SECRET=*** COOKIE="***" ./scripts/smoke/pilot_launch.sh
# Or: SMOKE_EMAIL=... SMOKE_PASSWORD=... SUPABASE_URL=... SUPABASE_ANON_KEY=... ./scripts/smoke/pilot_launch.sh
```

---

## Smoke run (this session)

**Preflight:**

- `GET /api/v1/health` → **503** (expected when Supabase env or DB unreachable).
- `POST /api/v1/admin/jobs/cron-tick` → **503**, body: `{"ok":false,"error":"Admin client not configured","error_code":"admin_not_configured"}`.

**Full smoke output (sanitized):**

```
Pilot launch smoke: http://localhost:3000 (from=2026-02-27 to=2026-03-06)
  FAIL: cron-tick → HTTP 503
  FAIL: ops/metrics → HTTP 500 (set COOKIE or AUTH_HEADER for tenant auth)
```

- **cron-tick:** 503 (admin not configured; no SUPABASE_SERVICE_ROLE_KEY in env).
- **ops/metrics:** 500 (dev server MODULE_NOT_FOUND; with a stable server and no auth would be 401).

---

## Final green condition (proof when achieved)

Smoke is **green** when:

1. **Instance:** Staging/prod with env set, or local `bun run build && bun run start` with `apps/web/.env.local` containing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Cron:** 200 and body has `ok: true` (and CRON_SECRET if REQUIRE_CRON_SECRET=true).
3. **Metrics:** 200 (tenant-scoped): set COOKIE or AUTH_HEADER, or use optional SMOKE_EMAIL/SMOKE_PASSWORD with SUPABASE_URL and SUPABASE_ANON_KEY so the script obtains a Bearer token.

**Example green excerpt:**

```
Pilot launch smoke: https://staging.example.com (from=... to=...)
  PASS: cron-tick
  PASS: ops/metrics
  Counters: uploads_stuck=0 uploads_expired=0 ...
  pilot_launch done
```

---

## Dev MODULE_NOT_FOUND fix + script

**Symptom:** Next.js dev server returns 500 with:

`Error: Cannot find module './chunks/vendor-chunks/next.js'`

**Fix:**

1. Run the reset script from repo root:
   ```bash
   ./scripts/dev/reset_next_dev_cache.sh
   ```
   This removes `apps/web/.next` and `apps/web/node_modules/.cache`.

2. Restart the dev server:
   ```bash
   cd apps/web && bun run dev
   ```

**Recommendation:** For pilot smoke, use **production mode** (`bun run build && bun run start`) or a **staging/prod** BASE_URL so the run is stable and not affected by dev bundler issues.

---

## Remaining blockers

- **Smoke not green in this run:** Local had no Supabase env (cron-tick 503) and no auth (metrics 401/500). The 500 on metrics was from the dev server MODULE_NOT_FOUND, not from the app contract.
- **To get green:** (1) Use BASE_URL pointing at staging/prod with env set, or (2) Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `apps/web/.env.local`, run `bun run build && bun run start`, then run smoke with COOKIE or AUTH_HEADER (or SMOKE_EMAIL/SMOKE_PASSWORD + Supabase URL/anon key) for ops/metrics.
