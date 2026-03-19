# Phase 8 — Operator diagnostic access

## Who

- **Tenant admin** (`requireAdmin`, read).

## Endpoints

### `GET /api/v1/admin/ops/ai-runtime`

Query params:

- `hours` — default 72, max 168
- `limit` — default 300, max 500

Response:

- `data.aggregates.by_action` — counts per `ai_*` audit action
- `data.aggregates.errors_by_kind` — `error_kind` histogram from error rows
- `data.aggregates.recent_error_sample` — last N errors with `trace_id` for log correlation
- `data.recent` — raw audit rows (safe details only)
- `correlation.build_sha`, `build_time`, `app_env` — release alignment

### `GET /api/v1/admin/audit-logs`

Full audit stream (includes non-AI). Filter client-side by `resource_type === "ai_runtime"`.

## Log correlation

1. User reports issue → copy **Request ID** from Copilot UI or response header `X-Request-Id`.
2. Search log aggregator for `request_id` or `trace_id` (audit uses `trace_id` = request id).
3. Query `audit_logs` for `trace_id` = request id.

## Not exposed

- End users without admin role.
- Raw prompts, full intelligence narrative, or secrets.
