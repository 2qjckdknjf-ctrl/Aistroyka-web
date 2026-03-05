# Sync conflict policy

Mobile clients sync via cursor-based deltas. Conflicting updates are resolved as follows.

## Server-authoritative

- **Task assignments:** Only server (manager) can assign; worker/contractor cannot change assignment. Last server write wins.
- **Approvals / status transitions:** Report submit, job status, and other approval flows are server-authoritative. Client sends intent; server applies and emits change_log.

## Last-write-wins (with version)

- **Draft notes / local edits:** If a resource has a `version` (or `updated_at`) field, clients may send updates with that version. Server rejects with **409 Conflict** and returns current server state when version does not match, so the client can merge or overwrite explicitly.

## Reject with 409

- When a write would conflict with a prior server state (e.g. "report already submitted", "session already finalized"), the API returns **409 Conflict** with a payload describing the conflict (e.g. `{ "error": "Report already submitted", "code": "conflict", "current_status": "submitted" }`). The client should refresh from sync and retry if appropriate.

## Idempotency

- All write endpoints support **x-idempotency-key**. Same key returns the same response without re-applying the mutation. Use per logical operation (e.g. one key per "submit report X") to avoid duplicate work after retries.

## Device and cursor

- **x-device-id** is required on sync endpoints (bootstrap, changes, ack). Each device maintains its own cursor; ack stores the cursor so the next sync can request changes after that point.
