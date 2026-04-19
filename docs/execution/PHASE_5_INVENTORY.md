# Phase 5 — Inventory (Copilot / AI Interaction Hardening)

**Date:** 2026-04-18  
**Stage:** A — Current Truth Inventory  
**Scope lock:** AI interaction reliability and runtime hardening.

## What Exists (repo truth)

### AI interaction APIs

- `POST /api/v1/projects/:id/copilot/chat/stream`
- `POST /api/v1/ai/analyze-image`
- `GET /api/v1/ai/requests`
- `GET /api/v1/ai/requests/:id`

### AI job runtime

- Job types:
  - `ai_analyze_report`
  - `ai_analyze_media`
- Queue processor and handlers:
  - `apps/web/lib/platform/jobs/job.service.ts`
  - `apps/web/lib/platform/jobs/job.handlers/ai-analyze-media.ts`
  - `apps/web/lib/platform/jobs/job.handlers/resolve-image-url.ts`

### Observability and controls

- AI telemetry events and runtime audit:
  - `apps/web/lib/observability/ai-telemetry.ts`
  - `apps/web/lib/observability/audit.service.ts`
- Rate limit/quota checks for vision endpoint:
  - `apps/web/lib/platform/rate-limit/rate-limit.service.ts`
  - `apps/web/lib/platform/ai-usage/ai-usage.service.ts`

## Proven gap found in this phase

`ai_analyze_media` could be dead-lettered too early when `upload_session` was still pending and image URL was not yet resolvable, causing avoidable AI job loss.

## Phase 5 closure targets

1. AI job reliability under pending upload/media states (retry over dead-letter).
2. Runtime proof on staging that pending-image scenario stays retryable.
3. Evidence artifacts for operational truth (`runtime matrix`, `validation`, `post-audit`).
