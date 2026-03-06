# Phase 6.3 — Pilot cutover & ops hygiene report

**Date:** 2026-03-09  
**Scope:** Ops correctness (uploads_stuck, devices_offline), last_seen on sync/changes, ops_events retention, docs. Build-only; no API contract breaks.

---

## 1. What changed

### Stage 1 — uploads_stuck semantics (P0)

- **Condition:** `uploads_stuck` = count where **status IN ('created', 'uploaded')** AND **created_at < (now() − STUCK_HOURS)**. Sessions must be **older than** the threshold (not “4h ago” as a point in time).
- **Config:** `UPLOAD_STUCK_HOURS` (default 4, clamped 1–168). Used in `lib/ops/ops-metrics.repository.ts` via `getStuckHours()`.
- **Tests:** Session older than threshold → count 1; no sessions older than threshold → count 0.

### Stage 2 — devices_offline distinct device count (P0)

- **Before:** Counted rows in `device_tokens` (multiple tokens per device could be double-counted).
- **After:** **COUNT(DISTINCT device_id)** via RPC `get_offline_device_count(p_tenant_id, p_since)`. Migration `20260309900000_ops_offline_device_count_rpc.sql` adds the function.
- **Config:** `DEVICE_OFFLINE_HOURS` (default 24, clamped 1–720). Used in `getDeviceOfflineHours()`.
- **Tests:** RPC returns `data: N` → `devices_offline` = N; test that distinct devices are not double-counted (RPC guarantees one count per device_id).

### Stage 3 — last_seen on sync/changes (P1)

- **Change:** On successful **GET /api/v1/sync/changes** (200), a best-effort update to `device_tokens.last_seen` for (tenant_id, user_id, device_id). Same pattern as sync/ack: fire-and-forget, log warn on failure (`device_last_seen_update_failed`). Does not block the response.

### Stage 4 — ops_events retention (P1)

- **Index:** `idx_ops_events_tenant_type_created` on (tenant_id, type, created_at) already present (Phase 6.2).
- **Job:** `ops_events_prune` — deletes rows in `ops_events` where `tenant_id` = job tenant and **created_at < (now() − retention_days)**. Logs `ops_events_pruned` with tenant_id, job_id, retention_days, pruned_count.
- **Config:** `OPS_EVENTS_RETENTION_DAYS` (default 90, clamped 1–365). Job payload may override with `retention_days`.
- **Hook:** **POST /api/v1/admin/jobs/cron-tick** enqueues one `ops_events_prune` per tenant (dedupe_key `ops_events_prune:<tenantId>`) in addition to `upload_reconcile`. Both are then processed by the same job worker.

### Stage 5 — Docs + gates

- This report; env vars and verification below.
- **REPORT-PHASE6-2-PILOT-READINESS.md** metrics table updated: uploads_stuck “older than threshold”, devices_offline “COUNT(DISTINCT device_id)”.

---

## 2. Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UPLOAD_STUCK_HOURS` | 4 | Hours after which a session in created/uploaded is considered stuck (1–168). |
| `DEVICE_OFFLINE_HOURS` | 24 | Hours after last_seen for a device to count as offline (1–720). |
| `OPS_EVENTS_RETENTION_DAYS` | 90 | Days to keep ops_events; older rows are pruned by ops_events_prune job (1–365). |

---

## 3. Verification

### Ops metrics (uploads_stuck, devices_offline)

```bash
curl -s "https://<host>/api/v1/ops/metrics?from=2026-03-01&to=2026-03-10" \
  -H "Cookie: <session-cookie>"
```

- **uploads_stuck:** Only sessions in status `created` or `uploaded` with `created_at` **older than** `UPLOAD_STUCK_HOURS` are counted.
- **devices_offline:** Count is distinct devices (one per device_id) with `last_seen` older than `DEVICE_OFFLINE_HOURS`.

### Sync changes (last_seen)

- Call **GET /api/v1/sync/changes?cursor=0&limit=10** with valid auth and `x-device-id`. On 200, backend updates `device_tokens.last_seen` for that device (best-effort). Check logs for `device_last_seen_update_failed` only if the update fails.

### Cron tick (ops_events_prune)

```bash
curl -s -X POST "https://<host>/api/v1/admin/jobs/cron-tick" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: $CRON_SECRET"
```

- Response includes `scheduled` (e.g. 4 for 2 tenants: 2× upload_reconcile + 2× ops_events_prune). Jobs are processed in the same run. Logs show `ops_events_pruned` with `pruned_count` when the prune job runs.

### Prune job only

- In Admin → Jobs, filter by type `ops_events_prune`. Runs periodically via cron-tick; deletes ops_events older than `OPS_EVENTS_RETENTION_DAYS`.

---

## 4. Gates

- `cd apps/web && npm test -- --run` — **334 tests passed**
- `cd apps/web && npm run cf:build` — **pass**

---

## 5. Commits (reference)

- fix(ops): correct uploads_stuck semantics + tests  
- fix(ops): devices_offline counts distinct devices  
- chore(sync): update device last_seen on changes (best-effort)  
- feat(ops): ops_events retention prune job  
- docs(phase6.3): pilot cutover report  
