# Migration Gap Matrix — 2026-06-20

Base: `origin/main` at `ff537c8dec1d9dcdd7ef834894951e625aa97a87`.

No migration files were edited, renamed, or applied.

| Migration | Branches | Short description | Table/function/policy/index affected | Product area | Already in main | Duplicate/replaced | Order/timestamp risk | RLS/security impact | Live DB dependency | Safe later | Recommended action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `20260617120000_ai_flywheel_foundation.sql` | `ai/flywheel-final-tail-closure`, `ai/expert-review-queue-mvp`, `ai/gold-memory-mvp`, `design/liquid-glass-public-shell-lg2a`, `feature/unified-product-design-certification` | Adds tenant AI training consent and internal AI preference/review tables | `tenants.ai_training_consent`; `ai_preference_pairs`; `ai_expert_reviews`; deny-all RLS policies; tenant/task/verdict indexes | AI | NO | UNKNOWN | HIGH: timestamp predates current main latest 20260620 migrations | HIGH: new tenant-scoped AI data tables; service-role-only intent must be verified | YES | MANUAL_REVIEW | `rewrite_as_new_migration_later` or `compare_to_live_db_later` |
| `20260617140000_ai_gold_memory.sql` | `ai/expert-review-queue-mvp`, `ai/gold-memory-mvp`, `design/liquid-glass-public-shell-lg2a`, `feature/unified-product-design-certification` | Adds sanitized Gold Memory table | `ai_gold_memory`; unique source constraint; tenant/task/input hash indexes; deny-all RLS | AI | NO | UNKNOWN | HIGH: timestamp predates current main latest 20260620 migrations | HIGH: stores scrubbed AI inputs/outputs and finance guard flags | YES | MANUAL_REVIEW | `rewrite_as_new_migration_later` |
| `20260617160000_ai_expert_review_queue.sql` | `ai/expert-review-queue-mvp`, `ai/gold-memory-mvp`, `design/liquid-glass-public-shell-lg2a`, `feature/unified-product-design-certification` | Adds internal Expert Review Queue table | `ai_expert_review_queue`; source uniqueness; tenant/status/pending indexes; deny-all RLS | AI | NO | UNKNOWN | HIGH: timestamp predates current main latest 20260620 migrations | HIGH: internal admin review queue, assigned expert user references auth users | YES | MANUAL_REVIEW | `rewrite_as_new_migration_later` |
| `20260307000000_fix_missing_rls_and_indexes.sql` | `origin/cursor/aistroyka-system-maturity-7957` | Older RLS/index repair migration from stale branch | Unknown without deeper stale-branch SQL review | auth/tenant / release/ops | NO | LIKELY/PARTIAL: main now contains extensive 202605 hardening migrations | HIGH: very old timestamp and branch is 553 behind main | HIGH if applied blindly; may conflict with current RLS/index state | YES | NO | `unsafe` / `ignore_stale` unless live DB audit proves a remaining gap |
| `20260526090000_user_identities.sql` | `origin/cursor/auth-and-dashboard-issues-eb7c` | Modified version of a migration already in main | `user_identities` migration content drift | auth/tenant | YES | UNKNOWN | HIGH: never edit already-applied migration history | HIGH: identity/auth data | YES | NO | `compare_to_live_db_later`; never overwrite existing migration |
| 22 hardening/product migrations from `release/publication-readiness-mega-sprint` | `release/publication-readiness-mega-sprint`, `origin/release/publication-readiness-mega-sprint` | Cabinet recovery and Supabase hardening migrations | filenames from `20260525210000_*` through `20260526111000_*` | auth/tenant / release/ops / product | YES by filename | YES/PARTIAL | MEDIUM if branch versions differ from main | HIGH if old SQL differs from current main | YES | NO | `keep_main`; ignore stale branch copies |

## AI-Related Migrations
- `20260617120000_ai_flywheel_foundation.sql`
- `20260617140000_ai_gold_memory.sql`
- `20260617160000_ai_expert_review_queue.sql`

## Product-Domain Migrations Outside Main
- No current product-domain migration outside main is approved.
- Older product/security migrations in `release/publication-readiness-mega-sprint` are already represented in main by filename.

## Release/Ops Migrations Outside Main
- `20260307000000_fix_missing_rls_and_indexes.sql` is an old release/security-style repair migration in a stale cursor branch. Treat as unsafe until compared against live DB and current main hardening migrations.

## Final Migration Verdict
- Safe now: none.
- Safe later after review: AI migrations only if rewritten/rebased as new migrations after live DB comparison.
- Must not apply blindly: all outside-main migrations.
