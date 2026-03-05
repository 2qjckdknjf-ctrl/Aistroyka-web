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
- **hint** (optional): Specific reason for conflict; same recovery (bootstrap, reset cursor, retry):
  - Default or generic: "Call bootstrap, reset cursor to serverCursor, then retry changes/ack."
  - **retention_window_exceeded**: Client cursor is older than the earliest retained change_log id. Client must bootstrap and set cursor to serverCursor.
  - **device_mismatch**: Client cursor does not match the last cursor stored for this device (e.g. using state from another device). Client must bootstrap and set cursor to serverCursor for this device.

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
