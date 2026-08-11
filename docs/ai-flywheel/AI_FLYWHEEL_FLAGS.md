# AI Flywheel Feature Flags

**Module:** `apps/web/lib/platform/ai-flywheel/flags.ts`  
**Default:** All flags **false** when unset

| Flag | Default | Risk | Owner | Enables | Disabled this sprint |
|------|---------|------|-------|---------|----------------------|
| `AI_FLYWHEEL_ENABLED` | false | Medium | Platform AI | Master gate for all flywheel features | — (foundation code only) |
| `AI_TRAINING_CONSENT_UI_ENABLED` | false | Medium | Product | Tenant consent settings UI | Full UI — backend only |
| `AI_FEEDBACK_CAPTURE_ENABLED` | false | High | Platform AI | `captureAiPreferencePair()` writes to DB | Production capture wiring |
| `AI_EXPERT_REVIEW_ENABLED` | false | High | Platform AI | `createExpertReviewCandidate()` writes to DB | Expert mobile/Telegram UX |
| `AI_DATASET_EXPORT_ENABLED` | false | **Critical** | Platform AI | Real dataset export paths | **All real JSONL export** |
| `AI_SHADOW_MODE_ENABLED` | false | **Critical** | Platform AI | Shadow model routing | **Entire shadow rollout** |
| `AI_GOLD_MEMORY_ENABLED` | false | High | Platform AI | Gold memory promotion | Memory promotion pipeline |

## Rules

1. Sub-flags require `AI_FLYWHEEL_ENABLED=true`
2. Foundation code may exist when flags are false — must be inert
3. `AI_SHADOW_MODE_ENABLED`, `AI_DATASET_EXPORT_ENABLED` (real export), training, rollout **must remain disabled** in this sprint

## Validation

- `apps/web/lib/platform/ai-flywheel/flags.test.ts` — default-off proofs
- `apps/web/lib/platform/ai-flywheel/behavior-safety.test.ts` — production AI paths do not import flywheel module
