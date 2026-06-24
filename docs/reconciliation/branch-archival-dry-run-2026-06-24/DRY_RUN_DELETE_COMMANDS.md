# Dry-Run Delete Commands — DO NOT EXECUTE

> **DO NOT EXECUTE. DRY-RUN ONLY. Requires owner approval in a separate operator task.**

**Generated:** 2026-06-24  
**Current `main` SHA:** `b9e3c02aad5f86008d35fdfcbf28ec1c427639f0`  
**Candidate count:** 21

Every command below is **DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR**.

## Preconditions (all required before any execution)

- [ ] Owner signed `05_OWNER_APPROVAL_CHECKLIST_2026-06-23.md`
- [ ] Exact branch list approved (matches this file)
- [ ] Backup/export evidence recorded (SHA manifest + optional archive tags)
- [ ] No open PR on any listed branch
- [ ] Separate operator task opened (not this docs PR)

## Remote deletion commands (text only)

```bash
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
# Requires owner approval in separate operator task

# Branch: audit/issue-110-github-governance-forensic-2026-06-23 @ 1f649114 — docs: audit github governance bypass issue
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete audit/issue-110-github-governance-forensic-2026-06-23

# Branch: audit/issue-116-docs-truth-stacked-audit-2026-06-22 @ b47a9120 — docs: audit docs truth stacked post-baseline scope
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete audit/issue-116-docs-truth-stacked-audit-2026-06-22

# Branch: docs/batch5-fk-count-fix @ 6839b3b3 — docs(audit): correct batch 5 unindexed_foreign_key
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete docs/batch5-fk-count-fix

# Branch: docs/issue-115-live-staging-smoke-runbook-2026-06-22 @ 4199e204 — docs: add live staging smoke runbook
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete docs/issue-115-live-staging-smoke-runbook-2026-06-22

# Branch: docs/issue-117-stale-branch-archival-plan-2026-06-23 @ 35133d1d — docs: add stale branch archival plan
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete docs/issue-117-stale-branch-archival-plan-2026-06-23

# Branch: docs/performance-advisors-update @ 50524a3e — Update performance advisor audit after batch 1 and
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete docs/performance-advisors-update

# Branch: docs/pr13-release-closure @ e5500630 — fix(manager): localize AI pipeline status labels
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete docs/pr13-release-closure

# Branch: fix/ai-vision-circuit-recovery @ bd2b6a4f — fix(ai): recover vision providers from stuck circu
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/ai-vision-circuit-recovery

# Branch: fix/auth-hibp-project-ref @ 59f8dea3 — Fix HIBP enable script to use canonical AISTROYKA 
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/auth-hibp-project-ref

# Branch: fix/drop-redundant-indexes-batch1 @ b5e6bde2 — Drop 23 redundant indexes and add Auth DB pool per
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/drop-redundant-indexes-batch1

# Branch: fix/drop-redundant-indexes-batch2 @ f3b27227 — Drop redundant audit/event fkfix indexes (batch 2)
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/drop-redundant-indexes-batch2

# Branch: fix/drop-redundant-indexes-batch3 @ 70ebbb34 — Drop redundant fkfix indexes on defects and change
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/drop-redundant-indexes-batch3

# Branch: fix/drop-redundant-indexes-batch4 @ 2f4d7d94 — Drop redundant fkfix indexes on client requests an
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/drop-redundant-indexes-batch4

# Branch: fix/drop-redundant-indexes-batch5 @ bbccef04 — Drop redundant fkfix indexes on commercial/AI enti
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/drop-redundant-indexes-batch5

# Branch: fix/drop-redundant-indexes-batch6 @ b15ae9a7 — Drop redundant actor fkfix indexes on entity table
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/drop-redundant-indexes-batch6

# Branch: fix/drop-redundant-indexes-batch7 @ bc58499b — Drop final low-traffic fkfix indexes (batch 7).
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/drop-redundant-indexes-batch7

# Branch: fix/issue-114-api-security-header-coverage-2026-06-22 @ b1b17bd9 — fix: verify API security header coverage
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/issue-114-api-security-header-coverage-2026-06-22

# Branch: fix/pilot-smoke-prefer-user-jwt @ b4166233 — fix(smoke): prefer password-grant JWT for pilot op
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/pilot-smoke-prefer-user-jwt

# Branch: fix/project-defects-insert-policy-merge @ 8e14519e — Merge project_defects INSERT RLS policies to clear
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/project-defects-insert-policy-merge

# Branch: fix/rls-split-overlapping-all-policies @ 6c425b9b — Split overlapping FOR ALL RLS policies for advisor
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/rls-split-overlapping-all-policies

# Branch: fix/smoke-json-arm64 @ b9946ee0 — fix(smoke): portable JSON parsing on Apple Silicon
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
git push origin --delete fix/smoke-json-arm64
```

## Optional local cleanup (after remote deletion approved)

```bash
# DRY-RUN ONLY — DO NOT EXECUTE IN THIS PR
# Only after remote deletion completed in separate approved task
# git branch -d audit/issue-110-github-governance-forensic-2026-06-23  # DRY-RUN ONLY
# git branch -d audit/issue-116-docs-truth-stacked-audit-2026-06-22  # DRY-RUN ONLY
# git branch -d docs/batch5-fk-count-fix  # DRY-RUN ONLY
# git branch -d docs/issue-115-live-staging-smoke-runbook-2026-06-22  # DRY-RUN ONLY
# git branch -d docs/issue-117-stale-branch-archival-plan-2026-06-23  # DRY-RUN ONLY
# git branch -d docs/performance-advisors-update  # DRY-RUN ONLY
# git branch -d docs/pr13-release-closure  # DRY-RUN ONLY
# git branch -d fix/ai-vision-circuit-recovery  # DRY-RUN ONLY
# git branch -d fix/auth-hibp-project-ref  # DRY-RUN ONLY
# git branch -d fix/drop-redundant-indexes-batch1  # DRY-RUN ONLY
# git branch -d fix/drop-redundant-indexes-batch2  # DRY-RUN ONLY
# git branch -d fix/drop-redundant-indexes-batch3  # DRY-RUN ONLY
# git branch -d fix/drop-redundant-indexes-batch4  # DRY-RUN ONLY
# git branch -d fix/drop-redundant-indexes-batch5  # DRY-RUN ONLY
# git branch -d fix/drop-redundant-indexes-batch6  # DRY-RUN ONLY
# git branch -d fix/drop-redundant-indexes-batch7  # DRY-RUN ONLY
# git branch -d fix/issue-114-api-security-header-coverage-2026-06-22  # DRY-RUN ONLY
# git branch -d fix/pilot-smoke-prefer-user-jwt  # DRY-RUN ONLY
# git branch -d fix/project-defects-insert-policy-merge  # DRY-RUN ONLY
# git branch -d fix/rls-split-overlapping-all-policies  # DRY-RUN ONLY
# git branch -d fix/smoke-json-arm64  # DRY-RUN ONLY
```

## Optional archive tags (separate approval required)

```bash
# DRY-RUN ONLY — tags NOT created in this dry-run
# git tag archive/audit/issue-110-github-governance-forensic-2026-06-23/2026-06-24 origin/audit/issue-110-github-governance-forensic-2026-06-23  # DRY-RUN ONLY
# git tag archive/audit/issue-116-docs-truth-stacked-audit-2026-06-22/2026-06-24 origin/audit/issue-116-docs-truth-stacked-audit-2026-06-22  # DRY-RUN ONLY
# git tag archive/docs/batch5-fk-count-fix/2026-06-24 origin/docs/batch5-fk-count-fix  # DRY-RUN ONLY
# git tag archive/docs/issue-115-live-staging-smoke-runbook-2026-06-22/2026-06-24 origin/docs/issue-115-live-staging-smoke-runbook-2026-06-22  # DRY-RUN ONLY
# git tag archive/docs/issue-117-stale-branch-archival-plan-2026-06-23/2026-06-24 origin/docs/issue-117-stale-branch-archival-plan-2026-06-23  # DRY-RUN ONLY
# git tag archive/docs/performance-advisors-update/2026-06-24 origin/docs/performance-advisors-update  # DRY-RUN ONLY
# git tag archive/docs/pr13-release-closure/2026-06-24 origin/docs/pr13-release-closure  # DRY-RUN ONLY
# git tag archive/fix/ai-vision-circuit-recovery/2026-06-24 origin/fix/ai-vision-circuit-recovery  # DRY-RUN ONLY
# git tag archive/fix/auth-hibp-project-ref/2026-06-24 origin/fix/auth-hibp-project-ref  # DRY-RUN ONLY
# git tag archive/fix/drop-redundant-indexes-batch1/2026-06-24 origin/fix/drop-redundant-indexes-batch1  # DRY-RUN ONLY
# git tag archive/fix/drop-redundant-indexes-batch2/2026-06-24 origin/fix/drop-redundant-indexes-batch2  # DRY-RUN ONLY
# git tag archive/fix/drop-redundant-indexes-batch3/2026-06-24 origin/fix/drop-redundant-indexes-batch3  # DRY-RUN ONLY
# git tag archive/fix/drop-redundant-indexes-batch4/2026-06-24 origin/fix/drop-redundant-indexes-batch4  # DRY-RUN ONLY
# git tag archive/fix/drop-redundant-indexes-batch5/2026-06-24 origin/fix/drop-redundant-indexes-batch5  # DRY-RUN ONLY
# git tag archive/fix/drop-redundant-indexes-batch6/2026-06-24 origin/fix/drop-redundant-indexes-batch6  # DRY-RUN ONLY
# git tag archive/fix/drop-redundant-indexes-batch7/2026-06-24 origin/fix/drop-redundant-indexes-batch7  # DRY-RUN ONLY
# git tag archive/fix/issue-114-api-security-header-coverage-2026-06-22/2026-06-24 origin/fix/issue-114-api-security-header-coverage-2026-06-22  # DRY-RUN ONLY
# git tag archive/fix/pilot-smoke-prefer-user-jwt/2026-06-24 origin/fix/pilot-smoke-prefer-user-jwt  # DRY-RUN ONLY
# git tag archive/fix/project-defects-insert-policy-merge/2026-06-24 origin/fix/project-defects-insert-policy-merge  # DRY-RUN ONLY
# git tag archive/fix/rls-split-overlapping-all-policies/2026-06-24 origin/fix/rls-split-overlapping-all-policies  # DRY-RUN ONLY
# git tag archive/fix/smoke-json-arm64/2026-06-24 origin/fix/smoke-json-arm64  # DRY-RUN ONLY
# git push origin --tags  # requires separate operator approval
```
