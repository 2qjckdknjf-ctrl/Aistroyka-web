# Phase 6.2 — Pilot readiness report

**Date:** 2026-03-09  
**Scope:** Ops correctness, cron reliability, real metrics. Build-only; no API contract breaks.

---

## 1. What changed

### Stage 1 — Upload reconcile dedupe (tenant-scoped)

- **Problem:** Dedupe key was global (`upload_reconcile`), so only one reconcile job was enqueued across all tenants.
- **Change:** Dedupe key is now **tenant-scoped:** `upload_reconcile:<tenantId>`. Each tenant gets one reconcile job per tick; same-tenant duplicate enqueues remain idempotent.
- **Files:** `apps/web/app/api/v1/admin/jobs/schedule-reconcile/route.ts` (dedupe_key), `route.test.ts` (2 tenants → 2 jobs with correct keys).

### Stage 2 — Single cron tick endpoint

- **New endpoint:** **POST /api/v1/admin/jobs/cron-tick**
- **Behavior:** (1) Enqueues one `upload_reconcile` job per tenant (tenant-scoped dedupe). (2) Calls the same job processing path as **POST /api/v1/jobs/process** (bounded by `JOB_CONFIG.MAX_CLAIM_LIMIT` and time budget).
- **Auth:** When `REQUIRE_CRON_SECRET=true`, request must include `x-cron-secret` (same as schedule-reconcile / jobs/process).
- **Response:** `{ ok: true, scheduled: number, processed: number, tenants: number }`.
- **Files:** `apps/web/app/api/v1/admin/jobs/cron-tick/route.ts`, `route.test.ts`.

### Stage 3 — Real `devices_offline` metric

- **Before:** Placeholder `devices_offline: 0`.
- **After:** Count of `device_tokens` where `last_seen < now() - 24 hours` (configurable via `DEVICE_OFFLINE_HOURS` in repo; default 24).
- **Source:** `device_tokens.last_seen` (migration adds column and index). Sync ack updates `last_seen` for the device (best-effort, non-blocking).
- **Files:** Migration `20260309700000_device_tokens_last_seen.sql`, `lib/ops/ops-metrics.repository.ts`, `app/api/v1/sync/ack/route.ts`, `ops-metrics.repository.test.ts`.

### Stage 4 — DB-backed `sync_conflicts` metric

- **Before:** Placeholder `sync_conflicts: 0`; no DB persistence.
- **After:** Table **ops_events** (tenant_id, type, created_at, metadata jsonb). On sync 409 (ack or changes), we insert `type: 'sync_conflict'` with metadata `{ hint, device_id }`. **GET /api/v1/ops/metrics** counts rows in `ops_events` with `type = 'sync_conflict'` and `created_at` in [from, to].
- **Files:** Migration `20260309800000_ops_events.sql`, `lib/ops/ops-events.repository.ts`, `lib/ops/ops-metrics.repository.ts`, `app/api/v1/sync/ack/route.ts`, `app/api/v1/sync/changes/route.ts`, tests for ops-events and ops-metrics.

### Stage 5 — Docs

- **Runbooks:** INCIDENT_SYNC_CONFLICTS.md, INCIDENT_UPLOADS_STUCK.md, JOBS_PROCESSING.md updated to reference **POST /api/v1/admin/jobs/cron-tick** and DB-backed sync_conflicts / devices_offline.
- **New:** `docs/operations/CRON_SETUP.md` — Cloudflare Cron Trigger, Vercel Cron, and external scheduler (curl) wiring with cron-tick.

---

## 2. How to verify

### Cron tick (single endpoint)

```bash
# Without cron secret (when REQUIRE_CRON_SECRET is unset or false)
curl -s -X POST "https://<host>/api/v1/admin/jobs/cron-tick" -H "Content-Type: application/json"

# With cron secret (when REQUIRE_CRON_SECRET=true)
curl -s -X POST "https://<host>/api/v1/admin/jobs/cron-tick" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET"
```

**Expected 200:** `{ "ok": true, "scheduled": N, "processed": M, "tenants": T }`  
**Expected 403 (when secret required):** `{ "code": "cron_unauthorized", ... }` if header missing or wrong.

### Schedule-reconcile (still available; tenant-scoped dedupe)

```bash
curl -s -X POST "https://<host>/api/v1/admin/jobs/schedule-reconcile" \
  -H "x-cron-secret: $CRON_SECRET"
```

Two tenants → two jobs enqueued (dedupe_key `upload_reconcile:<tenant1>`, `upload_reconcile:<tenant2>`).

### Ops metrics (tenant-scoped; session auth)

```bash
curl -s "https://<host>/api/v1/ops/metrics?from=2026-03-01&to=2026-03-10" \
  -H "Cookie: <session-cookie>"
```

**Expected 200:** JSON with numeric fields, e.g.:

- `uploads_stuck`, `uploads_expired` — from upload_sessions.
- `devices_offline` — count of device_tokens with `last_seen` older than 24h (or configured threshold).
- `sync_conflicts` — count of ops_events (type `sync_conflict`) in [from, to].
- `ai_failed`, `jobs_failed`, `push_failed` — unchanged.

---

## 3. Expected metrics behavior

| Metric | Source | Semantics |
|--------|--------|-----------|
| uploads_stuck | upload_sessions | status in (created, uploaded), created_at **older than threshold** (default 4h; env `UPLOAD_STUCK_HOURS`). |
| uploads_expired | upload_sessions | status = expired, created_at in [from, to]. |
| devices_offline | device_tokens (RPC) | **COUNT(DISTINCT device_id)** where last_seen &lt; now() − threshold (default 24h; env `DEVICE_OFFLINE_HOURS`). |
| sync_conflicts | ops_events | type = sync_conflict, created_at in [from, to]. |
| ai_failed, jobs_failed, push_failed | jobs / push_outbox | unchanged. |

All counts are **tenant-scoped** (tenant from auth). Optional `from` / `to` (ISO) and `project_id` (where supported) filter the range.

---

## 4. Gates

- `cd apps/web && npm test -- --run` — pass.
- `cd apps/web && npm run cf:build` — pass.

---

## 5. Commits (reference)

- fix(jobs): tenant-scoped dedupe_key for upload_reconcile scheduling  
- feat(cron): single tick endpoint for reconcile scheduling and job processing  
- feat(ops): real devices_offline metric from last_seen  
- feat(ops): db-backed sync_conflicts signal for metrics  
- docs(phase6.2): pilot readiness report + cron setup  
