# Sync conflict policy

Mobile clients sync via cursor-based deltas. Conflict handling is resource-specific.

---

## Server-authoritative

- **Task assignments:** Assigned by manager/admin; client must not overwrite. On conflict (e.g. task reassigned while offline), client applies server state.
- **Approvals / status transitions:** Report submitted, media finalized, job completion — server state wins. Client retries with idempotency key; duplicate requests return cached response.

---

## Last-write-wins (with version)

- **Draft notes / local edits:** If a resource has a `version` or `updated_at` field, client may send last-write-wins updates. Server accepts if client version is not stale; otherwise returns **409 Conflict** with current server payload so client can merge or replace.

---

## Reject conflicting updates (409)

- When the server detects a conflicting update (e.g. resource was modified by another device/user after client's base cursor), respond with **409 Conflict** and body:
  - `{ "error": "Conflict", "code": "CONFLICT", "conflict": { "resource_type", "resource_id", "server_version" } }`
- Client should refresh from sync/changes or bootstrap and retry.

---

## Idempotency

- All write endpoints support **x-idempotency-key**. Same key returns same response (cached). Use per logical operation to avoid duplicate report submits, finalizes, or ack when retrying.

---

## Device identity

- **x-device-id** is required on sync endpoints (bootstrap, changes, ack). Used to store per-device cursor and to attribute conflicts when needed.
