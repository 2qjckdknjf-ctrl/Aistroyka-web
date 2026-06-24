# Excluded Branches — Dry-Run Manifest

**Generated:** 2026-06-24  
**Current `main` SHA:** `b9e3c02aad5f86008d35fdfcbf28ec1c427639f0`

Branches excluded from the exact archive candidate list and why.

## Dangerous — DO NOT MERGE / DO NOT DELETE without forensic review (10)

| Branch | Reason |
|--------|--------|
| `audit/issue-111-ai-flywheel-stacked-audit-2026-06-21` | DO_NOT_MERGE_DANGEROUS (not merged); broad merge forbidden; `d810465b` |
| `audit/issue-112-mobile-pilot-stacked-audit-2026-06-22` | DO_NOT_MERGE_DANGEROUS (not merged); broad merge forbidden; `1a862c8f` |
| `audit/issue-114-middleware-security-stacked-audit-2026-06-22` | DO_NOT_MERGE_DANGEROUS (not merged); broad merge forbidden; `4475dcd1` |
| `cursor/aistroyka-system-maturity-7957` | DO_NOT_MERGE_DANGEROUS (not merged); broad merge forbidden; `63d9f26f` |
| `integration/aistroyka-full-reconciliation-2026-06-20` | DO_NOT_MERGE_DANGEROUS (merged); broad merge forbidden; `bc23c832` |
| `release/cloudflare-agent-starter-split` | DO_NOT_MERGE_DANGEROUS (merged); broad merge forbidden; `17547e66` |
| `release/phase5-2-1` | DO_NOT_MERGE_DANGEROUS (merged); broad merge forbidden; `2ad42578` |
| `release/publication-readiness-mega-sprint` | DO_NOT_MERGE_DANGEROUS (not merged); broad merge forbidden; `c6617419` |
| `release/vercel-prod-hardening-2026-03-05` | DO_NOT_MERGE_DANGEROUS (merged); broad merge forbidden; `667212dd` |
| `release/web-pilot-rc` | DO_NOT_MERGE_DANGEROUS (not merged); broad merge forbidden; `9d6a7812` |

**Primary forbidden:** `cursor/aistroyka-system-maturity-7957` — ~584 commits stale; auth/sync/media/migrations; never broad-merge.

## Open PR branches (5)

| PR | Head branch | Reason excluded |
|----|-------------|-----------------|
| #119 | `cursor/critical-bug-investigation-66e8` | Active open PR — must not delete |
| #108 | `design/liquid-glass-public-shell-lg2a` | Active open PR — must not delete |
| #106 | `ai/expert-review-queue-mvp` | Active open PR — must not delete |
| #104 | `ai/gold-memory-mvp` | Active open PR — must not delete |
| #103 | `ai/flywheel-final-tail-closure` | Active open PR — must not delete |

## KEEP ACTIVE (9)

| Branch | Reason excluded |
|--------|-----------------|
| `ai/expert-review-queue-mvp` | Classified KEEP ACTIVE in issue #117 plan |
| `ai/flywheel-final-tail-closure` | Classified KEEP ACTIVE in issue #117 plan |
| `ai/gold-memory-mvp` | Classified KEEP ACTIVE in issue #117 plan |
| `cursor/critical-bug-investigation-66e8` | Classified KEEP ACTIVE in issue #117 plan |
| `design/liquid-glass-public-shell-lg2a` | Classified KEEP ACTIVE in issue #117 plan |
| `docs/issue-116-current-truth-index-2026-06-23` | Classified KEEP ACTIVE in issue #117 plan |
| `fix/diagnostics-route-env-sensitive-mock-2026-06-23` | Classified KEEP ACTIVE in issue #117 plan |
| `main` | Classified KEEP ACTIVE in issue #117 plan |
| `polish/issue-118-reports-export-ui-2026-06-23` | Classified KEEP ACTIVE in issue #117 plan |

## DELETE NEVER WITHOUT BACKUP (8)

| Branch | Reason excluded |
|--------|-----------------|
| `audit/architecture-lockdown-forensic-intake-2026-06-22` | Requires tag/export backup evidence before any deletion consideration |
| `claude/aistroyka-audit-security-infra-cg810i` | Requires tag/export backup evidence before any deletion consideration |
| `docs/supabase-performance-advisors` | Requires tag/export backup evidence before any deletion consideration |
| `fix/deploy-ref-validation-clean` | Requires tag/export backup evidence before any deletion consideration |
| `fix/supabase-create-analysis-job-rpc-surface` | Requires tag/export backup evidence before any deletion consideration |
| `fix/supabase-offline-count-rpc-hardening` | Requires tag/export backup evidence before any deletion consideration |
| `fix/supabase-stakeholder-status-rpc-hardening` | Requires tag/export backup evidence before any deletion consideration |
| `hotfix/deploy-workflow-yaml` | Requires tag/export backup evidence before any deletion consideration |

## NEEDS MANUAL REVIEW (77)

Manual triage required before archive or delete. Full list from issue #117 plan:

| Branch | vs main (snapshot) |
|--------|-------------------|
| `audit/final-global-premerge-audit-2026-06-21` | not merged |
| `audit/issue-113-design-public-stacked-audit-2026-06-22` | not merged |
| `audit/issue-115-live-staging-smoke-stacked-audit-2026-06-22` | not merged |
| `audit/issue-117-stale-branch-archival-stacked-audit-2026-06-22` | not merged |
| `audit/issue-118-reports-export-ui-polish-stacked-audit-2026-06-22` | not merged |
| `chore/actions-runtime-refresh` | merged |
| `chore/agents-md-continual-learning` | merged |
| `chore/deep-production-completion` | merged |
| `chore/enable-auth-hibp` | merged |
| `chore/next-after-pr12` | merged |
| `cursor-test` | merged |
| `cursor/admin-expert-review-bugs-5228` | not merged |
| `cursor/android-platform-launch-b8bb` | not merged |
| `cursor/auth-and-dashboard-issues-eb7c` | not merged |
| `cursor/critical-bug-investigation-7dfb` | not merged |
| `cursor/critical-bug-investigation-c421` | not merged |
| `cursor/critical-correctness-bugs-20fe` | not merged |
| `cursor/critical-correctness-bugs-2263` | not merged |
| `cursor/critical-correctness-bugs-4030` | not merged |
| `cursor/critical-correctness-bugs-7cfa` | not merged |
| `cursor/critical-correctness-bugs-84c0` | not merged |
| `cursor/critical-correctness-bugs-85e3` | not merged |
| `cursor/critical-correctness-bugs-af15` | not merged |
| `cursor/development-environment-setup-b598` | not merged |
| `cursor/development-environment-setup-ba4b` | not merged |
| `cursor/discussion-status-silent-failure-c12b` | not merged |
| `cursor/technical-documentation-updates-569f` | not merged |
| `develop` | merged |
| `feat/manager-ai-parity-and-live-gates` | merged |
| `feat/platform-owner-cabinet` | merged |
| `feat/stage2-2-account-workspace` | merged |
| `fix/ios-e2e-workflow-push-phantom` | not merged |
| `fix/prod-ai-secrets-no-var-conflict` | not merged |
| `fix/prod-ai-worker-secrets` | not merged |
| `fix/prod-vision-model-gpt4o-mini` | not merged |
| `ops/c03-branch-protection-script` | merged |
| `ops/close-c03-evidence` | merged |
| `ops/external-setup-attempt` | merged |
| `ops/post-merge-closure-2026-06-15` | merged |
| `ops/post-merge-governance-checklist` | merged |
| `snapshots/2026-03-15` | merged |
| `snapshots/2026-03-16` | merged |
| `snapshots/2026-03-17` | merged |
| `snapshots/2026-03-18` | merged |
| `snapshots/2026-03-19` | merged |
| `snapshots/2026-03-20` | merged |
| `snapshots/2026-03-21` | merged |
| `snapshots/2026-03-22` | merged |
| `snapshots/2026-03-23` | merged |
| `snapshots/2026-03-24` | merged |
| `snapshots/2026-03-25` | merged |
| `snapshots/2026-03-26` | merged |
| `snapshots/2026-03-27` | merged |
| `snapshots/2026-03-28` | merged |
| `snapshots/2026-03-29` | merged |
| `snapshots/2026-03-30` | merged |
| `snapshots/2026-03-31` | merged |
| `snapshots/2026-04-01` | merged |
| `snapshots/2026-04-02` | merged |
| `snapshots/2026-04-03` | merged |
| `snapshots/2026-04-04` | merged |
| `snapshots/2026-04-05` | merged |
| `snapshots/2026-04-06` | merged |
| `snapshots/2026-04-07` | merged |
| `snapshots/2026-04-08` | merged |
| `snapshots/2026-04-09` | merged |
| `snapshots/2026-04-10` | merged |
| `snapshots/2026-04-11` | merged |
| `snapshots/2026-04-12` | merged |
| `snapshots/2026-04-13` | merged |
| `snapshots/2026-04-14` | merged |
| `snapshots/2026-04-15` | merged |
| `snapshots/2026-04-16` | merged |
| `snapshots/2026-04-17` | merged |
| `snapshots/2026-04-18` | merged |
| `snapshots/2026-04-19` | merged |
