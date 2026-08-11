# Expert Review Queue Readiness Audit

**Date:** 2026-06-17  
**Verdict:** **GO** for MVP implementation

## A1. Existing `ai_expert_reviews`

| Item | Status |
|------|--------|
| Table | Exists (flywheel foundation migration) |
| Columns | verdict, expert_conclusion, expert_rationale, corrected_output_json, task_type, tenant_id |
| RLS | Deny-all (service-role only) |
| Helper | `createExpertReviewCandidate()` — writes completed reviews when `AI_EXPERT_REVIEW_ENABLED` |
| Live rows | **0** |

**Gap:** No pending-queue state; table stores **completed** reviews only → separate queue table required.

## A2. Candidate source routes

| Source | MVP | Notes |
|--------|-----|-------|
| `ai_preference_pairs` | **YES** | chosen vs rejected JSON, audience, task_type |
| `ai_feedback_records` (low score) | **YES** | factuality/usefulness ≤ 2 |
| Copilot `recordRun()` | Deferred | No structured correction payload in queue v1 |
| Manual seed (script) | **YES** | Dry-run fixtures |

## A3. Admin UI patterns

| Pattern | Location |
|---------|----------|
| Route prefix | `/admin/ai/*` |
| Layout guard | `admin/layout.tsx` → `requireAdmin` (owner/admin) |
| Consent UI reference | `/admin/ai/training-consent` |
| API auth | `hasMinRole(..., "admin")` + tenant context |
| i18n | `aiFlywheel.*` namespace |

**Selected MVP UI:** `/admin/ai/expert-review`

## A4. Security

| Control | Application |
|---------|-------------|
| Queue RLS | Deny-all; service-role via API after admin check |
| PII | Scrub + verifier on display/submit |
| Finance | Audience labels + finance guard on owner/customer |
| Audit | Safe metadata via observability module |
| Gold Memory | Bridge disabled by default |

## Selected MVP scope

- **Queue table:** `ai_expert_review_queue` (new)
- **Sources:** preference_pairs, low-score feedback, manual
- **UI:** Admin expert review page (flag-gated)
- **Submission:** → `ai_expert_reviews` + queue status update

## Deferred

- Telegram bot, mobile expert UI, Copilot auto-enqueue, platform-owner cross-tenant queue

## Risks

| Risk | Mitigation |
|------|------------|
| DATA_SUPPLY_EMPTY | Honest dry-run classification |
| Raw PII in queue JSON | Scrub before insert/display |
| Accidental Gold Memory write | Bridge + GM write flags default false |

## GO/NO-GO

**GO**
