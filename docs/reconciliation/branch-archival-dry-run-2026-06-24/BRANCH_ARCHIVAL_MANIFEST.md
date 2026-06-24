# Branch Archival Manifest — Dry-Run Only

**Generated:** 2026-06-24  
**Current `main` SHA:** `b9e3c02aad5f86008d35fdfcbf28ec1c427639f0`  
**Operator:** dry-run only — **no branches deleted, no refs mutated**

## Summary

| Metric | Count |
|--------|------:|
| Total remote branches (snapshot) | 125 |
| Total local branches (snapshot) | 116 |
| Merged into `origin/main` | 88 |
| Not merged into `origin/main` | 38 |
| Open PRs (head branches) | 5 |
| **Exact archive candidates (this dry-run)** | **21** |

## Explicit no-delete statement

**No branch deletion was performed in this dry-run.**  
**No ref mutation was performed.**  
**No tags were created.**  
Future deletion requires owner approval per `docs/reconciliation/issue-117-stale-branch-archival-plan-2026-06-23/05_OWNER_APPROVAL_CHECKLIST_2026-06-23.md`.

## Exact archive candidates

Conservative criteria (all must be true):

- Remote branch exists
- Merged into or contained by `origin/main`
- No open PR on branch
- Not `main`, not this dry-run branch
- Not in DO_NOT_MERGE_DANGEROUS set
- Not in NEEDS_MANUAL_REVIEW set
- Not in KEEP_ACTIVE set
- Not in DELETE_NEVER_WITHOUT_BACKUP set
- Not `cursor/aistroyka-system-maturity-7957`

| Branch | Short SHA | Last commit date | Subject | Contained in main | Open PR | Reason safe to archive |
|--------|-----------|------------------|---------|-------------------|---------|------------------------|
| `audit/issue-110-github-governance-forensic-2026-06-23` | `1f649114` | 2026-06-23 | docs: audit github governance bypass issue | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `audit/issue-116-docs-truth-stacked-audit-2026-06-22` | `b47a9120` | 2026-06-22 | docs: audit docs truth stacked post-baseline scope | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `docs/batch5-fk-count-fix` | `6839b3b3` | 2026-06-02 | docs(audit): correct batch 5 unindexed_foreign_keys count to | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `docs/issue-115-live-staging-smoke-runbook-2026-06-22` | `4199e204` | 2026-06-22 | docs: add live staging smoke runbook | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `docs/issue-117-stale-branch-archival-plan-2026-06-23` | `35133d1d` | 2026-06-23 | docs: add stale branch archival plan | YES | NO | Merged into origin/main post #117 plan; no open PR; docs-only merged branch safe... |
| `docs/performance-advisors-update` | `50524a3e` | 2026-05-29 | Update performance advisor audit after batch 1 and Auth DB p | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `docs/pr13-release-closure` | `e5500630` | 2026-05-20 | fix(manager): localize AI pipeline status labels | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/ai-vision-circuit-recovery` | `bd2b6a4f` | 2026-06-02 | fix(ai): recover vision providers from stuck circuit breaker | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/auth-hibp-project-ref` | `59f8dea3` | 2026-05-29 | Fix HIBP enable script to use canonical AISTROYKA project re | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/drop-redundant-indexes-batch1` | `b5e6bde2` | 2026-05-29 | Drop 23 redundant indexes and add Auth DB pool percent workf | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/drop-redundant-indexes-batch2` | `f3b27227` | 2026-05-29 | Drop redundant audit/event fkfix indexes (batch 2). | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/drop-redundant-indexes-batch3` | `70ebbb34` | 2026-06-02 | Drop redundant fkfix indexes on defects and change orders (b | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/drop-redundant-indexes-batch4` | `2f4d7d94` | 2026-06-02 | Drop redundant fkfix indexes on client requests and document | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/drop-redundant-indexes-batch5` | `bbccef04` | 2026-06-02 | Drop redundant fkfix indexes on commercial/AI entity tables  | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/drop-redundant-indexes-batch6` | `b15ae9a7` | 2026-06-02 | Drop redundant actor fkfix indexes on entity tables (batch 6 | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/drop-redundant-indexes-batch7` | `bc58499b` | 2026-06-02 | Drop final low-traffic fkfix indexes (batch 7). | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/issue-114-api-security-header-coverage-2026-06-22` | `b1b17bd9` | 2026-06-22 | fix: verify API security header coverage | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/pilot-smoke-prefer-user-jwt` | `b4166233` | 2026-04-19 | fix(smoke): prefer password-grant JWT for pilot ops/metrics | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/project-defects-insert-policy-merge` | `8e14519e` | 2026-05-29 | Merge project_defects INSERT RLS policies to clear remaining | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/rls-split-overlapping-all-policies` | `6c425b9b` | 2026-05-29 | Split overlapping FOR ALL RLS policies for advisor performan | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |
| `fix/smoke-json-arm64` | `b9946ee0` | 2026-06-16 | fix(smoke): portable JSON parsing on Apple Silicon hosts | YES | NO | Classified ARCHIVE_CANDIDATE in issue #117 plan; merged into origin/main; no ope... |

## SHA evidence per candidate

| Branch | Full SHA |
|--------|----------|
| `audit/issue-110-github-governance-forensic-2026-06-23` | `1f649114d305026b12675c6d0a751c1e53fcb4c7` |
| `audit/issue-116-docs-truth-stacked-audit-2026-06-22` | `b47a91208dd3d52c46c4745fc1349448ef4cc25e` |
| `docs/batch5-fk-count-fix` | `6839b3b3b9ba602e6e2db0c9a0422dd257f860e9` |
| `docs/issue-115-live-staging-smoke-runbook-2026-06-22` | `4199e204b2d323caa90b7f9201f78e697a2b371f` |
| `docs/issue-117-stale-branch-archival-plan-2026-06-23` | `35133d1d98e02c797f72cb2e3b6c02a6393a2c4e` |
| `docs/performance-advisors-update` | `50524a3ea0e3dd5efc993ad3f4abe946a083c81c` |
| `docs/pr13-release-closure` | `e5500630a284c365258aac3a951dad866edebb3e` |
| `fix/ai-vision-circuit-recovery` | `bd2b6a4f5a46f0a231fa6b2cf9985f0a500df912` |
| `fix/auth-hibp-project-ref` | `59f8dea3298ad532724ab7d27b49564ed4482576` |
| `fix/drop-redundant-indexes-batch1` | `b5e6bde2207537dc55dea98129570dfc9e12e7b9` |
| `fix/drop-redundant-indexes-batch2` | `f3b27227970a662849497226e126fa6b82a0c65f` |
| `fix/drop-redundant-indexes-batch3` | `70ebbb345ba828a638aa60c4eccfc42a23368741` |
| `fix/drop-redundant-indexes-batch4` | `2f4d7d94132586e211e2c526727da135f5b29ceb` |
| `fix/drop-redundant-indexes-batch5` | `bbccef048d8aeaa1532982c955376729b3083bef` |
| `fix/drop-redundant-indexes-batch6` | `b15ae9a74745832eafe77be467239cb6add5a59b` |
| `fix/drop-redundant-indexes-batch7` | `bc58499b2e2a020f807933e2b7a8beaad953c26f` |
| `fix/issue-114-api-security-header-coverage-2026-06-22` | `b1b17bd9d86342f1fc1b187298e0ead04e34fc67` |
| `fix/pilot-smoke-prefer-user-jwt` | `b4166233fd96ddfd61b0262f154e62b6e1bc6abb` |
| `fix/project-defects-insert-policy-merge` | `8e14519efb878d173cc77642eab84adf493ec7d1` |
| `fix/rls-split-overlapping-all-policies` | `6c425b9b10efefdccd03cc42a7961987ca2bdad7` |
| `fix/smoke-json-arm64` | `b9946ee05cdd6a38f6eea35a093d8f57e97df9a1` |

## Open PR exclusion evidence

Open PR head branches at snapshot time (5 total):

| PR | Head branch | URL |
|----|-------------|-----|
| #119 | `cursor/critical-bug-investigation-66e8` | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/119 |
| #108 | `design/liquid-glass-public-shell-lg2a` | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/108 |
| #106 | `ai/expert-review-queue-mvp` | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/106 |
| #104 | `ai/gold-memory-mvp` | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/104 |
| #103 | `ai/flywheel-final-tail-closure` | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/103 |

## Dangerous branch exclusions

`cursor/aistroyka-system-maturity-7957` and all DO_NOT_MERGE_DANGEROUS branches are **excluded** from deletion candidates. See `EXCLUDED_BRANCHES.md`.

## Manual review exclusions

77 branches classified NEEDS_MANUAL_REVIEW in issue #117 plan are **excluded**. See `EXCLUDED_BRANCHES.md`.

## Future backup tag format (not created in this dry-run)

If owner approves deletion in a separate operator task, optional archive tags may use:

```
archive/<branch-name>/<yyyy-mm-dd>
```

Example: `archive/fix/smoke-json-arm64/2026-06-24`

**Tag creation is NOT performed in this dry-run.** Tag creation and tag push require separate operator approval.

## Future deletion command reference

See `DRY_RUN_DELETE_COMMANDS.md` — text only, **DO NOT EXECUTE**.

## Owner approval required

Deletion of any branch listed here requires:

1. Owner sign-off on exact branch list (`05_OWNER_APPROVAL_CHECKLIST_2026-06-23.md`)
2. Backup manifest with SHA evidence (this file satisfies dry-run backup planning)
3. Separate operator task (not bundled with product PRs)
4. Line-by-line command review before any `git push origin --delete`

## Artifacts

- `artifacts/remote-branches-before.txt`
- `artifacts/local-branches-before.txt`
- `artifacts/remote-merged-main.txt`
- `artifacts/remote-not-merged-main.txt`
- `artifacts/open-prs.json`
