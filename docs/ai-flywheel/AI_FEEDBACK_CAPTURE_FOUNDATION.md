# AI Feedback Capture Foundation

**Date:** 2026-06-17

## Table

`ai_preference_pairs` (migration `20260617120000_ai_flywheel_foundation.sql`)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| ai_request_id | text nullable | No `ai_requests` table; jobs use `jobs` |
| tenant_id | uuid | FK tenants |
| task_type | text | e.g. copilot, vision |
| audience | text | default internal |
| input_json | jsonb | |
| rejected_json | jsonb | |
| chosen_json | jsonb | |
| edit_distance | int | Levenshtein |
| source | text | default system |
| low_value | boolean | true when edit_distance < 8 |
| created_at | timestamptz | |

## RLS

**Deny-all** — service role only. No tenant/manager/worker/owner SELECT.

## Helper

`captureAiPreferencePair()` in `apps/web/lib/platform/ai-flywheel/feedback-capture.ts`

- **Inert** unless `AI_FEEDBACK_CAPTURE_ENABLED=true` (and master `AI_FLYWHEEL_ENABLED`)
- No UI changes in this sprint
- No interruption to manager workflow

## Tests

- Flag false → no insert
- Flag true → insert with `low_value=true` when edit_distance < 8

## Wiring (closure sprint)

Optional fields on `POST /api/v1/ai/feedback` → `tryCaptureFeedbackPreferencePair()` — see `AI_FEEDBACK_CAPTURE_WIRING_REPORT.md`
