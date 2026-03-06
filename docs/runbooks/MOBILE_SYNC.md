# Mobile Sync Runbook

Offline-first sync: bootstrap, changes, ack. Deterministic 409 conflict handling.

## Endpoints

- **GET /api/v1/sync/bootstrap** — Full snapshot (tasks, reports, upload sessions) + initial cursor. Requires `x-device-id`.
- **GET /api/v1/sync/changes?cursor=&limit=** — Delta after cursor. Requires `x-device-id`.
- **POST /api/v1/sync/ack** — Persist device cursor. Body: `{ "cursor": number }`. Requires `x-device-id`. Lite clients must send `x-idempotency-key`.

## 409 Conflict Contract

When the client cursor is ahead of the server (e.g. stale or corrupted state), the API returns **409 Conflict** with a stable body:

```json
{
  "error": "conflict",
  "code": "sync_conflict",
  "serverCursor": 42,
  "must_bootstrap": true,
  "hint": "Call bootstrap, reset cursor to serverCursor, then retry changes/ack."
}
```

- **serverCursor**: Latest change_log id for the tenant. Client must adopt this.
- **must_bootstrap**: When `true`, client should refetch full state via bootstrap before continuing.
- **hint** (optional): Machine-readable hint. Values:
  - `retention_window_exceeded` — Client cursor is below the earliest retained cursor (env `SYNC_MIN_RETAINED_CURSOR`). Client must bootstrap and use `serverCursor`.
  - `device_mismatch` — Client cursor is behind the stored cursor for this device (e.g. cursor from another device). Client should adopt `serverCursor` and retry ack/changes.
  - Default (cursor in future): "Call bootstrap, reset cursor to serverCursor, then retry changes/ack."

## Env

- **SYNC_MIN_RETAINED_CURSOR** — Optional. Earliest change_log id retained for the tenant. Client cursors below this get 409 with `hint: retention_window_exceeded`. Omit or `0` to disable.

## Recovery Flow (on 409)

1. **Receive 409** from `GET /api/v1/sync/changes` or `POST /api/v1/sync/ack`.
2. **Parse body**: `serverCursor`, `must_bootstrap`.
3. **If `must_bootstrap`**:
   - Call **GET /api/v1/sync/bootstrap** (same tenant/user, `x-device-id`).
   - Replace local snapshot with `data` (tasks, reports, uploadSessions).
   - Set local cursor to response `cursor` (or `serverCursor` from 409).
4. **Retry**:
   - For **changes**: `GET /api/v1/sync/changes?cursor=<serverCursor>&limit=...`
   - For **ack**: `POST /api/v1/sync/ack` with body `{ "cursor": serverCursor }` (with same `x-idempotency-key` if lite).

## Idempotency (Lite)

Sync ack is idempotent: same `x-idempotency-key` returns the same response. Use a key derived from device + cursor (e.g. `ack-<deviceId>-<cursor>`) so retries are safe.

## Flaky Network

- **Bootstrap**: Retry with backoff; no cursor dependency.
- **Changes**: On 409, run recovery above. On 5xx, retry with same cursor.
- **Ack**: On 409, run recovery. On 5xx, retry with same body and idempotency key.
