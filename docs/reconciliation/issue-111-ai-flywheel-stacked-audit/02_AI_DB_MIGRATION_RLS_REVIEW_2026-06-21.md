# AI DB Migration and RLS Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

No migrations were applied during this audit. No live Supabase data was read or mutated.

## Migrations Found Outside PR #109

|Migration|Found in branches|Purpose|RLS posture|Apply verdict|
|---|---|---|---|---|
|`20260617120000_ai_flywheel_foundation.sql`|`origin/ai/flywheel-final-tail-closure`, `origin/ai/expert-review-queue-mvp`, `origin/ai/gold-memory-mvp`|Adds `tenants.ai_training_consent`, `ai_preference_pairs`, `ai_expert_reviews`.|Enables RLS and creates deny-all policies for internal tables.|Not safe to apply from branch as-is until live schema drift, service-role access, consent UI, and audit behavior are validated in staging.|
|`20260617140000_ai_gold_memory.sql`|`origin/ai/expert-review-queue-mvp`, `origin/ai/gold-memory-mvp`|Adds `ai_gold_memory` with scrubbed inputs/outputs and embedding JSON.|RLS deny-all policy.|Not safe to apply until PII scrub, finance guard, source uniqueness, embedding provider behavior, and retention rules are reviewed.|
|`20260617160000_ai_expert_review_queue.sql`|`origin/ai/expert-review-queue-mvp`, `origin/ai/gold-memory-mvp`|Adds `ai_expert_review_queue` for pending internal review candidates.|RLS deny-all policy.|Not safe to apply until admin-only route checks, queue payload scrubbing, tenant scoping, and workflow side effects are validated.|

## RLS and Security Observations

Positive signs:

- Internal AI tables use RLS deny-all policies.
- Tables reference `public.tenants(id)` with cascade behavior.
- Training consent defaults to `false`.
- Gold Memory records include `pii_scrub_version`, `finance_guard_passed`, and `consent_snapshot`.

Risks:

- Deny-all RLS implies all runtime writes/reads depend on service-role code paths. That increases blast radius if any admin route or server helper is too broad.
- The migration adds `tenants.ai_training_consent`; existing live schema and tenant defaults must be verified before rollout.
- `ai_preference_pairs` and queue payloads store JSON that may contain operational, customer, PII, or internal finance data if guards fail.
- `ai_gold_memory` persists scrubbed examples and embeddings; retention, deletion, tenant isolation, and embedding model/provider behavior need explicit validation.
- Branch docs claim readiness in places, but this audit did not verify live database state.

## Staging Requirements Before Apply

Before any AI migration PR:

- Compare live AISTROYKA schema and migration history against the proposed migration names and objects.
- Rework migrations if timestamps or prior live objects conflict.
- Run migrations in local/staging first.
- Prove RLS denies anon/authenticated tenant users for all new AI tables.
- Prove service-role access is only used by server routes with tenant/admin checks.
- Add route tests for owner/admin, member, viewer, stakeholder, anonymous, and cross-tenant paths.
- Verify rollback or forward-fix plan for consent column and AI tables.

## Verdict

AI migrations safe to apply now: NO.

Reason: RLS shape is promising, but live schema drift, service-role route boundaries, consent workflow, PII/customer-finance guards, and staging evidence are not complete.
