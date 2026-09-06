# Finance Dataset Guard

**Date:** 2026-06-17  
**Module:** `apps/web/lib/platform/ai-flywheel/finance-dataset-guard.ts`

## Purpose

Defensive guard for future dataset export. **Owner/customer audience examples must not contain internal finance vocabulary.** Isolation lives in export guards — not model behavior.

## Helpers

| Function | Role |
|----------|------|
| `ownerAudienceDatasetGuard(example)` | Block single owner/customer example with internal finance terms |
| `financeDatasetGuard(examples[])` | Batch guard with blocked counts and reasons |
| `isLikelyOwnerSafeCommercial(text)` | Informational check for customer-facing commercial language |

## Blocked vocabulary (owner/customer audience)

Internal terms include: margin, profitability, budget pressure, planned/actual cost, overrun, subcontractor cost, labor cost, margin risk, cashflow, cost item, and Russian equivalents.

Amount patterns: `internal cost €…`, `margin …%`, `profit €…`, `subcontractor price €…`

## Rules

- Owner-safe commercial language (estimates for approval, change orders, payment schedule) passes
- Internal audience examples are not auto-blocked but must retain `audience` labels
- **Does not change** current production owner/customer projections

## Tests

`apps/web/lib/platform/ai-flywheel/finance-dataset-guard.test.ts`:
- Owner-safe examples pass
- Internal margin/profit/cost leakage fails
- Guard report counts blocked examples
