# Incident Runbook: Sync Conflicts (409)

When mobile or lite clients see repeated **409 Conflict** on sync (changes/ack), or ops sees a spike in `sync_conflict` telemetry.

## Symptoms

- Clients report "sync failed" or "please refresh".
- Logs show `event: "sync_conflict"` with `hint`: `retention_window_exceeded` | `cursor_ahead` | `device_mismatch`.
- **GET /api/v1/ops/metrics** returns `sync_conflicts` from DB (ops_events with type `sync_conflict` in the requested range).

## Endpoints

| Action | Endpoint | Notes |
|--------|----------|--------|
| Changes | **GET** `/api/v1/sync/changes?cursor=&limit=` | Requires `x-device-id`, auth. |
| Ack | **POST** `/api/v1/sync/ack` | Body `{ "cursor": number }`, `x-device-id`, lite: `x-idempotency-key`. |
| Bootstrap | **GET** `/api/v1/sync/bootstrap` | Full snapshot + cursor; use after 409 when `must_bootstrap: true`. |

## Diagnostic queries (Supabase / SQL)

- **Change log size (tenant):**  
  `SELECT COUNT(*), MAX(id) FROM change_log WHERE tenant_id = '<tenant_id>';`
- **Cursors for device:**  
  `SELECT * FROM sync_cursors WHERE tenant_id = '<tenant_id>' AND device_id = '<device_id>';`
- **Min retained cursor (env):** `SYNC_MIN_RETAINED_CURSOR` — if set, cursors below this get 409 with `retention_window_exceeded`.

## Actions

1. **Confirm hint from logs**  
   Filter logs for `event: "sync_conflict"` and `tenant_id` / `device_id`. Identify whether:
   - **retention_window_exceeded** — Client cursor is below retained window. Normal if retention was tightened or client very stale.
   - **cursor_ahead** — Client claims a cursor larger than server `MAX(change_log.id)`. Can indicate clock/corruption or duplicate device.
   - **device_mismatch** — Client cursor is behind the cursor stored for this device (e.g. app reinstall, another device used same device_id).

2. **Client recovery (per MOBILE_SYNC.md)**  
   - On 409: parse `serverCursor`, `must_bootstrap`.  
   - If `must_bootstrap`: call **GET /api/v1/sync/bootstrap**, replace local state, set cursor to `serverCursor`.  
   - Retry **changes** with `cursor=serverCursor` or **ack** with `{ "cursor": serverCursor }`.

3. **If one device_id is stuck**  
   - Inspect `sync_cursors` for that tenant + device_id.  
   - No direct API to reset; client must call bootstrap and then ack with `serverCursor` to resync.

4. **If retention is too aggressive**  
   - Review `SYNC_MIN_RETAINED_CURSOR`. If set too high, many clients will get 409. Consider lowering or unset for a period; ensure change_log retention (e.g. cleanup job) matches.

## Cockpit / dashboards

- **Ops overview:** `/[locale]/dashboard` (overview). Sync conflict count comes from **GET /api/v1/ops/metrics** (DB-backed from ops_events).
- **Lightweight metrics:** **GET** `/api/v1/ops/metrics?from=&to=` — returns `sync_conflicts` (count of ops_events with type `sync_conflict` in [from, to]).

## References

- **MOBILE_SYNC.md** — Sync contract, 409 body, recovery flow, idempotency.
- **REPORT-PHASE6-2-PILOT-READINESS.md** — DB-backed sync_conflicts (ops_events), real metrics.
- **REPORT-PHASE6-PROD-HARDENING.md** — Sync telemetry (`sync_conflict` event).
