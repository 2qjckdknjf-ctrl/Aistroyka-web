# Branch Archival Execution Report

**Date:** 2026-06-24  
**Base `main` SHA at execution start:** `082f5324001ce935e2a7fec13d7b599bc878a167`  
**Source manifest:** `docs/reconciliation/branch-archival-dry-run-2026-06-24/BRANCH_ARCHIVAL_MANIFEST.md`  
**Owner checklist:** `docs/reconciliation/issue-117-stale-branch-archival-plan-2026-06-23/05_OWNER_APPROVAL_CHECKLIST_2026-06-23.md`

## Owner approval record

| Field | Value |
|-------|-------|
| Approver | Owner (via execution operator task authorization) |
| Date | 2026-06-24 |
| Branches approved for deletion | Exact 21 from merged dry-run manifest SHA table |
| Backup manifest path | `docs/reconciliation/branch-archival-execution-2026-06-24/APPROVED_BRANCH_SHA_MANIFEST.txt` |
| Archive tags path | `docs/reconciliation/branch-archival-execution-2026-06-24/ARCHIVE_TAGS_CREATED.txt` |
| Deletion task | ops/branch-archival-execution-2026-06-24 |

**Approval basis:** Merged PR #130 dry-run manifest; issue #117 plan + owner checklist; exact 21-branch list verified pre-delete (merged into main, no open PRs, not dangerous/manual-review).

## Execution summary

| Metric | Value |
|--------|-------|
| Owner-approved candidate count | 21 |
| Branches deleted | **YES** (21) |
| Refs mutated | **YES** (remote branch deletion only) |
| Archive tags created | **YES** (21) |
| Archive tags pushed | **YES** |
| Remote branches before | 126 |
| Remote branches after | 105 |
| Branches removed | 21 |

## Deleted branch table

| Branch | Deleted | Backup tag | Original SHA |
|--------|---------|------------|--------------|
| `audit/issue-110-github-governance-forensic-2026-06-23` | YES | `archive/audit/issue-110-github-governance-forensic-2026-06-23/2026-06-24` | `1f649114d305026b12675c6d0a751c1e53fcb4c7` |
| `audit/issue-116-docs-truth-stacked-audit-2026-06-22` | YES | `archive/audit/issue-116-docs-truth-stacked-audit-2026-06-22/2026-06-24` | `b47a91208dd3d52c46c4745fc1349448ef4cc25e` |
| `docs/batch5-fk-count-fix` | YES | `archive/docs/batch5-fk-count-fix/2026-06-24` | `6839b3b3b9ba602e6e2db0c9a0422dd257f860e9` |
| `docs/issue-115-live-staging-smoke-runbook-2026-06-22` | YES | `archive/docs/issue-115-live-staging-smoke-runbook-2026-06-22/2026-06-24` | `4199e204b2d323caa90b7f9201f78e697a2b371f` |
| `docs/issue-117-stale-branch-archival-plan-2026-06-23` | YES | `archive/docs/issue-117-stale-branch-archival-plan-2026-06-23/2026-06-24` | `35133d1d98e02c797f72cb2e3b6c02a6393a2c4e` |
| `docs/performance-advisors-update` | YES | `archive/docs/performance-advisors-update/2026-06-24` | `50524a3ea0e3dd5efc993ad3f4abe946a083c81c` |
| `docs/pr13-release-closure` | YES | `archive/docs/pr13-release-closure/2026-06-24` | `e5500630a284c365258aac3a951dad866edebb3e` |
| `fix/ai-vision-circuit-recovery` | YES | `archive/fix/ai-vision-circuit-recovery/2026-06-24` | `bd2b6a4f5a46f0a231fa6b2cf9985f0a500df912` |
| `fix/auth-hibp-project-ref` | YES | `archive/fix/auth-hibp-project-ref/2026-06-24` | `59f8dea3298ad532724ab7d27b49564ed4482576` |
| `fix/drop-redundant-indexes-batch1` | YES | `archive/fix/drop-redundant-indexes-batch1/2026-06-24` | `b5e6bde2207537dc55dea98129570dfc9e12e7b9` |
| `fix/drop-redundant-indexes-batch2` | YES | `archive/fix/drop-redundant-indexes-batch2/2026-06-24` | `f3b27227970a662849497226e126fa6b82a0c65f` |
| `fix/drop-redundant-indexes-batch3` | YES | `archive/fix/drop-redundant-indexes-batch3/2026-06-24` | `70ebbb345ba828a638aa60c4eccfc42a23368741` |
| `fix/drop-redundant-indexes-batch4` | YES | `archive/fix/drop-redundant-indexes-batch4/2026-06-24` | `2f4d7d94132586e211e2c526727da135f5b29ceb` |
| `fix/drop-redundant-indexes-batch5` | YES | `archive/fix/drop-redundant-indexes-batch5/2026-06-24` | `bbccef048d8aeaa1532982c955376729b3083bef` |
| `fix/drop-redundant-indexes-batch6` | YES | `archive/fix/drop-redundant-indexes-batch6/2026-06-24` | `b15ae9a74745832eafe77be467239cb6add5a59b` |
| `fix/drop-redundant-indexes-batch7` | YES | `archive/fix/drop-redundant-indexes-batch7/2026-06-24` | `bc58499b2e2a020f807933e2b7a8beaad953c26f` |
| `fix/issue-114-api-security-header-coverage-2026-06-22` | YES | `archive/fix/issue-114-api-security-header-coverage-2026-06-22/2026-06-24` | `b1b17bd9d86342f1fc1b187298e0ead04e34fc67` |
| `fix/pilot-smoke-prefer-user-jwt` | YES | `archive/fix/pilot-smoke-prefer-user-jwt/2026-06-24` | `b4166233fd96ddfd61b0262f154e62b6e1bc6abb` |
| `fix/project-defects-insert-policy-merge` | YES | `archive/fix/project-defects-insert-policy-merge/2026-06-24` | `8e14519efb878d173cc77642eab84adf493ec7d1` |
| `fix/rls-split-overlapping-all-policies` | YES | `archive/fix/rls-split-overlapping-all-policies/2026-06-24` | `6c425b9b10efefdccd03cc42a7961987ca2bdad7` |
| `fix/smoke-json-arm64` | YES | `archive/fix/smoke-json-arm64/2026-06-24` | `b9946ee05cdd6a38f6eea35a093d8f57e97df9a1` |

## Excluded branches (not touched)

- **DO_NOT_MERGE_DANGEROUS (10):** not deleted — includes `cursor/aistroyka-system-maturity-7957`
- **NEEDS_MANUAL_REVIEW (77):** not deleted
- **KEEP_ACTIVE (9):** not deleted
- **DELETE_NEVER_WITHOUT_BACKUP (8):** not deleted
- **Open PR head branches (5):** not deleted — #103, #104, #106, #108, #119

## Safety confirmation

- No code changes in this execution
- No scripts changed
- No env changes
- No deploy
- No smoke
- No migrations
- No live Supabase data touched
- No branch protection changes
- No forbidden branches deleted

## Artifacts

- `REMOTE_BRANCHES_BEFORE_DELETE.txt`
- `REMOTE_BRANCHES_AFTER_DELETE.txt`
- `APPROVED_BRANCH_SHA_MANIFEST.txt`
- `ARCHIVE_TAGS_CREATED.txt`
