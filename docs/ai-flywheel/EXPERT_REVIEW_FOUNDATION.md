# Expert Review Foundation

**Date:** 2026-06-17

## Table

`ai_expert_reviews` (migration `20260617120000_ai_flywheel_foundation.sql`)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| ai_request_id | text nullable | |
| tenant_id | uuid | FK |
| task_type | text | |
| expert_user_id | uuid | FK auth.users |
| verdict | text | model_correct \| model_partially_correct \| model_wrong \| both_models_wrong |
| expert_conclusion | text | |
| expert_rationale | text nullable | |
| corrected_output_json | jsonb nullable | |
| input_source | text | default text |
| review_time_seconds | int nullable | |
| created_at | timestamptz | |

## RLS

**Deny-all** — service role only. Future `ai_expert` role planned; not exposed to normal users now.

## Helper

`createExpertReviewCandidate()` in `apps/web/lib/platform/ai-flywheel/expert-review.ts`

- Inert unless `AI_EXPERT_REVIEW_ENABLED=true`

## Future queue design (deferred)

1. Service role enqueues candidates from preference pairs / eval failures
2. Expert role claims item (future RLS policy)
3. Verdict written via helper
4. Corrected output enters scrub + finance guard before any export

## Intentionally deferred

- Expert mobile UX
- Telegram bot
- Audio upload pipeline
- Expert assignment / SLA
