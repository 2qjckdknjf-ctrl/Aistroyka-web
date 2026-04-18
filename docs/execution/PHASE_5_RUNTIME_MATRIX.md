# Phase 5 — Runtime Matrix (Staging)

**Date:** 2026-04-18  
**Environment:** `staging`

## Goal

Prove key Phase 5 runtime hardening outcomes:

1. Pending-image AI media jobs are retried instead of dead-lettered.
2. Copilot stream route can create/persist chat threads in staging.

## Runtime procedure

### Flow A — ai_analyze_media pending URL retry

1. Inserted synthetic `upload_sessions` row with status `uploaded` via Supabase MCP.
2. Inserted synthetic `jobs` row (`type=ai_analyze_media`) referencing that upload session.
3. Triggered `POST /api/v1/admin/jobs/cron-tick` repeatedly.
4. Queried job state via Supabase MCP.

## Observed result

- Synthetic job id: `e6ea6ddd-d7b1-41f9-80c3-c1258337eb77`
- Post-processing snapshot:
  - `status = queued`
  - `attempts = 2`
  - `last_error = "Image URL not ready yet (upload session pending)"`
  - `last_error_type = JOB_HANDLER_ERROR`
- Expected anti-regression behavior confirmed:
  - job did **not** become `dead`.

Cleanup:

- Synthetic job and upload-session rows were removed after validation.

### Flow B — copilot chat stream persistence

1. Runtime probe before fix:
   - `POST /api/v1/projects/{id}/copilot/chat/stream` returned `503` with `Failed to create thread`.
2. Applied MCP migration for missing chat persistence tables:
   - `ai_chat_threads`
   - `ai_chat_messages`
3. Runtime probe after migration:
   - same endpoint returns `200` SSE with `meta` event and a valid `thread_id`.

Observed post-fix sample:

- `thread_id = 3442c6a3-6674-4610-98b3-57bceee8acd6`
- route no longer fails on thread creation path.

## Runtime verdict (slices completed)

- **PASS** for both:
  - pending-image retry hardening,
  - copilot stream persistence hardening.
