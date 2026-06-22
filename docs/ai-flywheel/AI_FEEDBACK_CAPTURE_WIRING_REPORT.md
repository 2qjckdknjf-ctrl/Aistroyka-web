# AI Feedback Capture Wiring Report

**Date:** 2026-06-17 (P2 hardening update)

## Wiring target

**Existing route:** `POST /api/v1/ai/feedback` (AI Brain Phase D)

**First client:** `CopilotChatPanel` diagnostics (dev/staging only) via `CopilotOptionalFeedback`

**Run linkage:** `POST /api/v1/projects/:id/copilot/chat/stream` now fire-and-forget `recordRun()` on successful/fallback completion so `runId` resolves.

## Client layer

| File | Role |
|------|------|
| `lib/features/ai/api/submitAiFeedback.ts` | Fetch wrapper; legacy + optional fields |
| `lib/features/ai/api/buildPreferencePairFields.ts` | Safe pair builder; null when incomplete |
| `lib/features/ai/components/CopilotOptionalFeedback.tsx` | Optional correction UI (diagnostics only) |

## Optional request fields

When present with `AI_FEEDBACK_CAPTURE_ENABLED=true` (+ master `AI_FLYWHEEL_ENABLED`):

| Field | Type | Purpose |
|-------|------|---------|
| `taskType` | string | e.g. copilot |
| `audience` | string | default `internal` |
| `inputContext` | object | input snapshot |
| `rejectedOutput` | object | model output before edit |
| `chosenOutput` | object | manager-corrected output |
| `aiRequestId` | string | optional trace |

## Flow

1. Client submits standard Phase D feedback (`runId`, scores, etc.)
2. `parsePreferencePairFromBody()` extracts optional pair fields
3. `submitFeedback()` completes primary feedback (unchanged contract)
4. `tryCaptureFeedbackPreferencePair(admin, ...)` — **non-strict**, best-effort
5. Writes to `ai_preference_pairs` via service role; `source=manager_edit`

## Safety

| Flag | Behavior |
|------|----------|
| `AI_FEEDBACK_CAPTURE_ENABLED=false` | No pair write; feedback unchanged |
| Capture failure | Does not fail feedback response |
| Malformed optional fields | Parsed as null; feedback still succeeds |
| Tenant JWT | Cannot read `ai_preference_pairs` (deny-all RLS) |

## Tests

- `app/api/v1/ai/feedback/route.test.ts` — legacy + preference payloads
- `lib/ai-brain/phase-d/feedback/feedback.service.test.ts` — capture non-blocking
- `lib/features/ai/api/*.test.ts` — client helpers
- `lib/platform/ai-flywheel/feedback-wire.test.ts` — flag + failure isolation

## Deferred

- AiActionPanel Edge copilot auto-capture (no unified run recorder on Edge)
- iOS manager edit flows
- Production-visible feedback UI (diagnostics gated to dev/staging)
