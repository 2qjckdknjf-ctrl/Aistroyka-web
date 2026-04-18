# Phase 5 — Runtime Matrix (Staging)

**Date:** 2026-04-18  
**Environment:** `staging`

## Goal

Prove that pending-image AI media jobs are retried instead of dead-lettered.

## Runtime procedure

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

## Runtime verdict (slice 1)

- **PASS** for pending-image retry hardening.
