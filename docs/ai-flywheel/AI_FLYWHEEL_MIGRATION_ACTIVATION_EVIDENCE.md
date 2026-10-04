# AI Flywheel Migration Activation Evidence

**Date:** 2026-06-17  
**Target project:** AISTROYKA (`vthfrxehrursfloevnlp`, eu-central-1)  
**Method:** Supabase MCP `apply_migration`

---

## Migration state before

- Local migration file: `20260617120000_ai_flywheel_foundation.sql`
- Remote migration list: **not present** (latest remote: `20260602064024_drop_redundant_indexes_batch7`)

## Migration apply

| Field | Value |
|-------|-------|
| Tool | `plugin-supabase-supabase.apply_migration` |
| Project ID | `vthfrxehrursfloevnlp` |
| Migration name | `ai_flywheel_foundation` |
| Remote version after apply | `20260617070145` |
| Result | **success: true** |

## Schema verification

```sql
-- tenants.ai_training_consent
column_name: ai_training_consent
data_type: boolean
column_default: false
```

Tables confirmed via MCP:
- `ai_preference_pairs` — exists
- `ai_expert_reviews` — exists

## RLS verification

| Table | RLS | Policy | qual | with_check |
|-------|-----|--------|------|------------|
| `ai_preference_pairs` | enabled | `ai_preference_pairs_deny_all` | `false` | `false` |
| `ai_expert_reviews` | enabled | `ai_expert_reviews_deny_all` | `false` | `false` |

Service role bypasses RLS — backend helpers (`captureAiPreferencePair`, `createExpertReviewCandidate`) operate via admin client as designed.

## Blockers

**None.** Migration applied and verified on live project AISTROYKA.

## Operator note

Repo file timestamp (`20260617120000`) differs from remote applied version (`20260617070145`) because MCP assigns apply-time version. SQL content matches repo migration file.
