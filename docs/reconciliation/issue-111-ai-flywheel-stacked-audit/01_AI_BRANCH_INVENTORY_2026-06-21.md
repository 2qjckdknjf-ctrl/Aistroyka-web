# AI/Flywheel Branch Inventory

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Primary AI Branches

|Branch|SHA|Ahead / behind PR #109|Changed files|AI migrations|Runtime paths|Tests|Docs|Classification|Risk|
|---|---:|---:|---:|---:|---:|---:|---|---|---|
|`origin/ai/flywheel-final-tail-closure`|`20b4f3f7dff8`|2 / 29|97|1|42|18|39|relevant foundation branch|High: schema and consent runtime must be isolated first.|
|`origin/ai/expert-review-queue-mvp`|`498b6743d41c`|12 / 29|169|3|77|29|72|relevant queue branch|High: internal admin queue and service-role table access.|
|`origin/ai/gold-memory-mvp`|`98a068c1d6e8`|39 / 29|349|3|77|36|170|relevant but broad|Very high: combines AI, admin surfaces, docs, and broad historical work.|

Local `ai/gold-memory-mvp` is `6d45608be138` and is broader than the remote copy: 40 commits ahead / 29 behind, 495 changed files, 3 migrations, 81 runtime paths, 39 tests, and 207 docs. Treat local-only divergence as unsafe for direct integration.

## Related Branches

|Branch|SHA|Summary|Classification|
|---|---:|---|---|
|`origin/cursor/admin-expert-review-bugs-5228`|`8590459e9d53`|39 ahead / 29 behind; 349 files; same 3 AI migrations; 77 runtime paths.|Relevant as review reference, not direct merge source.|
|`origin/feat/manager-ai-parity-and-live-gates`|`43d3737d0761`|No diff against PR #109.|Superseded/contained.|
|`origin/fix/ai-vision-circuit-recovery`|`bd2b6a4f5a46`|No diff against PR #109.|Superseded/contained.|
|`origin/fix/prod-ai-secrets-no-var-conflict`|`55ded23b442c`|1 file ahead; no runtime/migration diff.|Ops/config reference only; do not mix with issue #111.|
|`origin/fix/prod-ai-worker-secrets`|`99e3bab197c2`|2 files ahead; no runtime/migration diff.|Ops/config reference only; do not mix with issue #111.|
|`chore/ai-memory-layer-v1`|`3ee6921ab6d3`|No merge base with PR #109.|Stale/unrelated history; unsafe to diff or merge.|
|`chore/web-ai-p0-panel`|`a5d66c258c61`|No merge base with PR #109.|Stale/unrelated history; unsafe to diff or merge.|

## Changed Path Themes

The relevant branches add or modify:

- `apps/web/supabase/migrations/20260617120000_ai_flywheel_foundation.sql`
- `apps/web/supabase/migrations/20260617140000_ai_gold_memory.sql`
- `apps/web/supabase/migrations/20260617160000_ai_expert_review_queue.sql`
- `apps/web/app/api/v1/tenant/ai-training-consent/route.ts`
- `apps/web/app/api/v1/tenant/ai-expert-review-queue/*`
- `apps/web/lib/platform/ai-flywheel/**`
- `apps/web/lib/features/ai/**`
- dashboard admin AI pages under `apps/web/app/[locale]/(dashboard)/admin/ai/**`
- AI Flywheel documentation under `docs/ai-flywheel/**`

## Inventory Verdict

Broad AI/Flywheel branch merge is not safe. The branches contain valuable work, but the DB/RLS, admin access, consent, runtime flags, and customer-finance controls must be reviewed in smaller PRs.
