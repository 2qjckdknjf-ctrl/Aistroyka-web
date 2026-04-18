# Phase 5 — Implementation Summary (Slice 1)

**Date:** 2026-04-18  
**Status:** Runtime-validated slices delivered.

## Implemented in this phase so far

1. Updated `ai_analyze_media` handler:
   - file: `apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.ts`
   - new behavior: classify unresolved image URL as retryable when upstream data is still pending.

2. Added focused handler tests:
   - file: `apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.test.ts`
   - verifies:
     - payload validation failure (`report_id` missing),
     - retryable pending upload-session case,
     - non-retryable unresolved terminal case.

3. Regression safety:
   - ran queue service tests alongside new handler tests.

4. Added missing Copilot stream persistence schema:
   - `apps/web/supabase/migrations/20260418143000_ai_chat_stream_tables.sql`
   - creates `ai_chat_threads` + `ai_chat_messages` with tenant RLS for stream route persistence.
   - migration was applied to staging via Supabase MCP.

5. Hardened Copilot stream provider-failure behavior:
   - file: `apps/web/app/api/v1/projects/[id]/copilot/chat/stream/route.ts`
   - new behavior:
     - when provider is unavailable/timeout/transport-failure, stream emits deterministic `done` fallback payload instead of terminating with fatal SSE path,
     - fallback is persisted in chat history,
     - telemetry/audit marks fallback invocation.
   - client compatibility:
     - fallback path now emits terminal `done` for parser-safe consumption.
   - transport parser updates:
     - file: `apps/web/lib/features/ai/api/chatApi.ts`
     - stream parser now propagates `fallback_reason` from `done` payload.
   - tests:
     - file: `apps/web/app/api/v1/projects/[id]/copilot/chat/stream/route.test.ts`
     - asserts deterministic `done` fallback event on provider non-OK.

6. Hardened vision analyze provider-failure behavior:
   - file: `apps/web/app/api/v1/ai/analyze-image/route.ts`
   - new behavior:
     - on `AIVisionFailedError` (provider unavailable/timeout), endpoint can return deterministic structured analysis fallback (`200`) with `X-AI-Fallback-Reason`,
     - fallback execution is explicit in telemetry/audit (`fallback_invoked`).
   - guard:
     - `AI_VISION_DETERMINISTIC_FALLBACK` controls fallback mode (`true` by default).

7. Regression tests for vision fallback path:
   - file: `apps/web/app/api/v1/ai/analyze-image/route.fallback.test.ts`

8. Operator SLO gate script (repeatable staging/local checks):
   - file: `scripts/smoke/ai_phase5_gate.sh`
   - documents: `apps/web/.env.example` (`AI_VISION_DETERMINISTIC_FALLBACK`)

## Deployment evidence

- Staging deploy run:
  - [Run 24604034163](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24604034163)
  - build + blocking smoke: PASS.
- Stream fallback deploy runs:
  - [Run 24605147102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24605147102) — PASS.
- Vision fallback deploy run:
  - [Run 24605486283](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24605486283) — PASS.
