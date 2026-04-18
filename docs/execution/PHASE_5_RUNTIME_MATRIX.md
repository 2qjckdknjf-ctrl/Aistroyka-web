# Phase 5 — Runtime Matrix (Staging)

**Date:** 2026-04-18  
**Environment:** `staging`

## Goal

Prove key Phase 5 runtime hardening outcomes:

1. Pending-image AI media jobs are retried instead of dead-lettered.
2. Copilot stream route can create/persist chat threads in staging.
3. Copilot stream degrades to deterministic fallback instead of hard SSE failure when provider is unavailable.
4. Vision analyze endpoint degrades to deterministic structured result instead of 502 on provider outage.

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

- **PASS** for all validated slices:
  - pending-image retry hardening,
  - copilot stream persistence hardening,
  - copilot stream deterministic fallback hardening,
  - vision analyze deterministic fallback hardening.

### Flow C — copilot stream provider fallback event contract

1. Triggered `POST /api/v1/projects/{id}/copilot/chat/stream` on staging where provider path returned unavailable state.
2. Verified SSE output no longer terminates with hard `error` event:
   - stream emits `meta`, then terminal `done`.
3. Verified `done` payload carries:
   - `fallback_reason = provider_unavailable`
   - deterministic fallback text,
   - persisted `assistant_message_id`.

Observed sample:

- `request_id = 1de4d246-e602-43a3-92de-4ab9dc63f4b8`
- `thread_id = 7c297617-f0be-48a7-84ae-23c64ce14aca`
- SSE sequence: `meta -> done` (no blocking transport error for client parser).

### Flow D — vision analyze provider fallback

1. Triggered `POST /api/v1/ai/analyze-image` on staging with authenticated tenant user and valid image URL.
2. Provider layer remained unavailable in runtime.
3. Endpoint returned deterministic fallback payload with HTTP `200` (instead of prior `502`), plus explicit fallback response header.

Observed sample:

- `status = 200`
- `x-ai-fallback-reason = provider_unavailable`
- Body:
  - `stage = unknown`
  - `completion_percent = 0`
  - `risk_level = medium`
  - actionable deterministic recommendations present.

### Flow E — repeatable SLO gate (operator script)

1. Run `scripts/smoke/ai_phase5_gate.sh` with the same auth patterns as pilot smoke (`AUTH_HEADER` or minted Supabase password grant).
2. Script asserts:
   - `POST /api/v1/ai/analyze-image` returns `200` with JSON matching `AnalysisResult` shape (full or fallback).
   - Optional: `INCLUDE_STREAM=1` + `PROJECT_ID` asserts copilot stream ends with `event: done`.

### Flow F — release pipeline after Workers Paid (bundle size)

1. Prior failure: Cloudflare `10027` / Worker exceeded **3 MiB** on Workers Free ([Run 24606077934](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24606077934)).
2. After account **Workers Paid** upgrade: full staging pipeline **PASS**, including `wrangler deploy` and blocking pilot smoke ([Run 24615810358](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24615810358)).
