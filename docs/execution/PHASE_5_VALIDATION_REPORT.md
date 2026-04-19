# Phase 5 — Validation Report (Slice 1)

**Date:** 2026-04-18  
**Scope:** AI interaction hardening slices (media retry + copilot stream persistence).

## Repo-level verification

- `bun run --cwd apps/web test "lib/platform/jobs/job.handlers/ai-analyze-media.test.ts" "lib/platform/jobs/job.service.test.ts"` -> PASS

## Deployment verification

- [Run 24604034163](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24604034163)
  - `Build and deploy to staging`: PASS
  - `Post-deploy pilot smoke`: PASS

## Runtime verification (MCP-backed)

- Supabase MCP was used to inject controlled pending-state data and inspect queue outcomes.
- Pending upload-session scenario remained retryable (`queued` + `JOB_HANDLER_ERROR`) after cron processing.
- Supabase MCP migration apply was used to add missing copilot chat persistence tables.
- Copilot stream route moved from `503 Failed to create thread` to `200` SSE with persisted `thread_id`.

## Validation verdict (current)

- **PASS**.

---

## Slice 2 — Provider fallback + SLO gate script

### Repo-level verification

- `bun run --cwd apps/web test "app/api/v1/ai/analyze-image/route.fallback.test.ts" "app/api/v1/ai/analyze-image/route.test.ts"` → PASS

### Deployment verification

- [Run 24605486283](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24605486283) — PASS (vision fallback path on staging)
- [Run 24605147102](https://github.com/2qjckdknjf-ctrl/Aistroyka-web/actions/runs/24605147102) — PASS (copilot stream fallback contract)

### Runtime verification (staging)

- `POST /api/v1/ai/analyze-image` with authenticated user: HTTP `200`, `X-AI-Fallback-Reason: provider_unavailable`, valid `AnalysisResult` JSON body.
- `POST /api/v1/projects/{id}/copilot/chat/stream`: SSE sequence `meta` → `done` with `fallback_reason` when provider unavailable (client-safe).

### Operational repeatability

- Added `scripts/smoke/ai_phase5_gate.sh` for operator-driven re-checks (auth same patterns as pilot smoke).

### Validation verdict (slice 2)

- **PASS**.
