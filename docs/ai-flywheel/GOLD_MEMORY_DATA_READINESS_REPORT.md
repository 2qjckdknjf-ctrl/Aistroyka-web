# Gold Memory Data Readiness Report

**Date:** 2026-06-17  
**Command:** `bun scripts/ai/build-gold-memory.ts --dry-run --limit 100 --source all --live`

## Live Supabase counts

| Source | Total rows | Gold candidates |
|--------|------------|-----------------|
| `ai_expert_reviews` | 0 | 0 |
| `ai_preference_pairs` | 0 | 0 |
| Tenants with `ai_training_consent=true` | 0 | — |

## Dry-run output (live)

```
candidates_scanned: 0
consent_rejected: 0
pii_rejected: 0
finance_rejected: 0
eligible: 0
written: 0
```

## Fixture dry-run (offline sanity)

```
candidates_scanned: 5
consent_rejected: 1
finance_rejected: 1
eligible: 3
```

## Decision

**Classification: DATA_SUPPLY_EMPTY**

No eligible live source rows exist. Write/retrieval/injection end-to-end smoke against real flywheel sources **cannot run** without faking data.

## Recommendation

**Expert Review Queue MVP** is the correct next phase to generate consented, scrubbed expert corrections before staging Gold Memory write/retrieval pilot.
