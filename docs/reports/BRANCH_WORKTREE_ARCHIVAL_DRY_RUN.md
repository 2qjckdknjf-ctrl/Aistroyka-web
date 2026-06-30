# Branch & Worktree Archival — DRY RUN (owner-gated)

> **DRY RUN ONLY. Nothing was deleted, removed, force-pushed, or committed.**
> Date: 2026-06-30 · Run branch: `ops/branch-archival-dry-run` · Policy: `docs/ops/BRANCH_ARCHIVAL_POLICY.md`
> Data source: local git refs at inspection time (no `fetch`/`prune` performed). `origin/main` tip observed at `e45c7630` (2026-06-30); local production pointer `post-merge-pr171` = `171fedda`.

## A. Counts

| Metric | Count |
|---|---|
| Local branches | 196 (incl. this run branch) |
| Remote branches (`origin/*`, excl. HEAD) | 142 |
| Worktrees | 39 (incl. main checkout) |
| Local merged into `origin/main` | 142 |
| Local NOT merged into `origin/main` | 54 |
| Branches with unpushed commits (`[ahead N]`) | 7 |
| Local branches whose remote is `[gone]` | 9 |
| Dirty worktrees (off-limits) | 9 |

## B. DANGEROUS — never touch in any execution (dirty / unpushed / protected)

### B1. Dirty worktrees (uncommitted/untracked work present)

| Worktree path | Branch | Changes | Risk |
|---|---|---|---|
| `/Users/alex/Projects/AISTROYKA` | `ops/branch-archival-dry-run` | working (this task) | Active session |
| `~/.cursor/worktrees/AISTROYKA/hvm` | detached `905328d7` | 72 | Live Cursor agent worktree |
| `~/.cursor/worktrees/AISTROYKA/jjd` | detached `905328d7` | 72 | Live Cursor agent worktree |
| `~/.cursor/worktrees/AISTROYKA/kln` | detached `eacc97b6` | 296 | Live Cursor agent worktree |
| `~/.cursor/worktrees/AISTROYKA/mse` | detached `905328d7` | 72 | Live Cursor agent worktree |
| `~/.cursor/worktrees/AISTROYKA/ncj` | detached `eacc97b6` | 294 | Live Cursor agent worktree |
| `~/.cursor/worktrees/AISTROYKA/owm` | detached `905328d7` | 73 | Live Cursor agent worktree |
| `~/.cursor/worktrees/AISTROYKA/wci` | detached `eacc97b6` | 294 | Live Cursor agent worktree |
| `/Users/alex/Projects/AISTROYKA-release-closure` | `main` | 306 | **`main` checked out and DIRTY** — do not touch |

> The 7 `~/.cursor/worktrees/*` are detached HEADs with substantial uncommitted work — treat as live cloud-agent scratch. **Never** remove or prune them in execution.

### B2. Branches with unpushed local commits (`[ahead N]` of own upstream) — preserve

| Branch | Ahead/behind | Note |
|---|---|---|
| `ai/gold-memory-mvp` | ahead 1 | KEEP_AI — unpushed commit |
| `cursor-test` | ahead 1 | KEEP_REVIEW — unpushed commit |
| `ops/external-setup-attempt` | ahead 4 (but merged into main) | KEEP_REVIEW — verify before any action |
| `ops/post-merge-closure-2026-06-15` | ahead 1 (merged) | KEEP_REVIEW |
| `ops/post-merge-governance-checklist` | ahead 1 (merged) | KEEP_REVIEW |
| `release/phase5-2-1` | ahead 19 | KEEP_RELEASE — 19 unpushed commits |
| `release/mobile-pilot-rc` | ahead 12, behind 121 | KEEP_RELEASE / KEEP_MOBILE — RC source of truth + unpushed |

### B3. Owner-protected (hard never-delete)

- `main`, `origin/main` — production truth.
- `cursor/aistroyka-system-maturity-7957` — explicitly protected by AGENTS rules.
- `release/web-pilot-rc`, `release/mobile-pilot-rc` — RC sources of truth.

## C. SAFE ARCHIVE CANDIDATES (merged into `origin/main`; tag-then-delete AFTER owner approval)

All below are **fully reachable from `origin/main`** (work preserved in production history). Recommendation: `ARCHIVE_CANDIDATE`. Branches attached to a worktree require the worktree to be removed first.

### C1. `post-merge-prNNN` validation snapshots (all merged, behind main)

`post-merge-pr127`, `…pr128`, `…pr129`, `…pr130`, `…pr131`, `…pr132`, `…pr133`, `…pr134`, `…pr135`, `…pr136`, `…pr137`, `…pr138`, `…pr139`, `…pr140`, `…pr141`, `…pr142`, `…pr143`, `…pr144`, `…pr145`, `…pr146`, `…pr147`, `…pr148`, `…pr149`, `…pr150`, `…pr151`, `…pr152`, `…pr153`, `…pr154`, `…pr155`, `…pr156`, `…pr157`, `…pr161`, `…pr162`, `…pr163`, `…pr164`, `…pr165`, `…pr166`, `…pr167`, `…pr168`, `…pr169`, `…pr170`, `…pr171`

- local/remote: **local-only** (upstream = `origin/main`, no dedicated remote).
- merged into main: **yes** · reason: transient post-merge validation pointers.
- ⚠️ Many are **attached to worktrees** (see §E table) — remove worktree before deleting branch.

### C2. Temp/post-merge integration pointers (merged)

`postmerge-main`, `temp-postmerge-main-122`, `temp-postmerge-main-124`, `deploy/lg-slice-1-production-2026-06-28`, `ops-com-redirect` (behind 185), `audit/full-project-git-archaeology-2026-06-20` (worktree+dirty=1 → review)

### C3. Merged `docs/*` (work landed in main)

`docs/agents-continual-learning-2026-06-28`, `docs/agents-continual-learning-final-2026-06-28`, `docs/agents-continual-learning-mobile-store-readiness-2026-06-29`, `docs/agents-learning-update-2026-06-26`, `docs/branch-archival-dry-run-2026-06-24`, `docs/issue-112-closure-checklist-2026-06-28`, `docs/issue-116-current-truth-index-2026-06-23`, `docs/issue-158-ios-distribution-preflight-2026-06-29`, `docs/issue-158-ios-mode-b-testflight-evidence-2026-06-29`, `docs/issue-158-ios-owner-actions-2026-06-29`, `docs/issue-159-android-distribution-preflight-2026-06-29`, `docs/issue-159-android-mode-b-upload-2026-06-29`, `docs/issue-159-android-play-internal-evidence-2026-06-29`, `docs/issue-159-android-play-internal-upload-evidence-2026-06-30`, `docs/issue-159-google-play-owner-actions-2026-06-29`, `docs/issue-160-mobile-pilot-distribution-decision-2026-06-29`, `docs/lg-slice-1-deploy-evidence-2026-06-28`, `docs/liquid-glass-fresh-recon-2026-06-28`, `docs/mobile-build-evidence-plan-2026-06-26`, `docs/mobile-pilot-readiness-refresh-2026-06-26`, `docs/performance-advisors-update`, `docs/post-136-truth-agents-housekeeping-2026-06-26`, `docs/post-138-truth-index-2026-06-26`, `docs/post-142-truth-index-2026-06-26`, `docs/post-144-truth-index-2026-06-26`, `docs/post-146-truth-index-2026-06-26`, `docs/pr13-release-closure`, `docs/production-public-drift-evidence-2026-06-28`, `docs/supabase-performance-advisors`, `docs/truth-index-update-2026-06-24`

### C4. Merged `audit/*`, `evidence/*`, `copy/*`, `polish/*`, `test/*`

`audit/architecture-lockdown-forensic-intake-2026-06-22`, `audit/issue-112-mobile-fresh-audit-2026-06-26`, `audit/issue-113-design-public-followup-2026-06-24`, `audit/issue-114-security-followup-2026-06-24`, `audit/issue-116-docs-truth-stacked-audit-2026-06-22` (gone→§D), `audit/release-readiness-max`, `evidence/android-debug-instrumented-2026-06-26`, `evidence/android-manager-instrumented-2026-06-28`, `evidence/ios-layer-b-e2e-2026-06-28`, `evidence/ios-simulator-smoke-2026-06-26`, `copy/issue-113-public-cta-i18n-2026-06-24`, `polish/issue-118-reports-export-ui-2026-06-23`, `test/issue-114-middleware-page-security-headers-2026-06-24`, `test/stage2-3b-account-lifecycle`

### C5. Merged `fix/*`, `chore/*`, `feat/*`, `hotfix/*`, `hardening/*`, `integration/*`, `mobile/*`, `ops/*`, `develop`

`fix/ai-vision-circuit-recovery`, `fix/android-distribution-readiness-issue-159`, `fix/auth-hibp-project-ref`, `fix/deploy-exact-ref-validation`, `fix/deploy-ref-validation-clean`, `fix/deploy-ref-validation-staging-main`, `fix/diagnostics-route-env-sensitive-mock-2026-06-23`, `fix/drop-redundant-indexes-batch1`…`batch7`, `fix/gdpr-workflow-main`, `fix/issue-114-api-security-header-coverage-2026-06-22`, `fix/pilot-smoke-prefer-user-jwt`, `fix/prod-auth-stabilization` (worktree), `fix/prod-dashboard-500-root-cause`, `fix/project-defects-insert-policy-merge`, `fix/public-homepage-mock-metrics-2026-06-26`, `fix/rls-split-overlapping-all-policies`, `fix/smoke-json-arm64`, `fix/supabase-create-analysis-job-rpc-surface`, `fix/supabase-offline-count-rpc-hardening`, `fix/supabase-stakeholder-status-rpc-hardening`, `chore/actions-runtime-refresh`, `chore/agents-md-continual-learning`, `chore/deep-production-completion`, `chore/enable-auth-hibp`, `chore/next-after-pr12`, `chore/production-closure-sprint`, `chore/rename-workerlite-to-aistroykaworker`, `feat/liquid-glass-public-slice-1-2026-06-28`, `feat/manager-ai-parity-and-live-gates`, `feat/multi-provider-auth-mainline`, `feat/p1-design-tokens`, `feat/p1-footer-tokens`, `feat/platform-owner-cabinet`, `feat/stage2-2-account-workspace`, `hardening/dashboard-auth-middleware-sweep`, `hotfix/deploy-workflow-yaml`, `hotfix/restore-pages-and-cf-api-headers`, `integration/aistroyka-full-reconciliation-2026-06-20`, `mobile/worker-lite-finalization`, `ops/branch-archival-execution-2026-06-24`, `ops/c03-branch-protection-script`, `ops/close-c03-evidence`, `ops/external-setup-attempt` (ahead 4→§B2 review), `ops/pilot-finalization`, `ops/post-merge-closure-2026-06-15` (ahead 1→review), `ops/post-merge-governance-checklist` (ahead 1→review), `develop`

> `feat/p1-design-tokens`, `feat/p1-footer-tokens`, `feat/liquid-glass-public-slice-1` are merged design work — archivable; live design re-slice source remains `release/web-pilot-rc` / `design/liquid-glass-public-shell-lg2a` (kept).

## D. DELETE_CANDIDATE_ONLY_AFTER_OWNER_APPROVAL (merged AND remote already `[gone]`)

Highest-confidence removals (still gated). Merged into main + remote tracking branch already deleted:

| Branch | Date | Merged | Remote |
|---|---|---|---|
| `audit/issue-110-github-governance-forensic-2026-06-23` | 2026-06-23 | yes | gone |
| `audit/issue-116-docs-truth-stacked-audit-2026-06-22` | 2026-06-22 | yes | gone |
| `chore/actions-node24-readiness` | 2026-05-26 | yes | gone (worktree `AISTROYKA-auth-mainline`, clean) |
| `docs/batch5-fk-count-fix` | 2026-06-02 | yes | gone |
| `docs/issue-115-live-staging-smoke-runbook-2026-06-22` | 2026-06-22 | yes | gone |
| `docs/issue-117-stale-branch-archival-plan-2026-06-23` | 2026-06-23 | yes | gone |
| `temp-pr125-merge` | 2026-06-23 | yes | gone |

### D1. Idempotency — a prior archival run already exists (2026-06-24)

**21 `archive/*` tags dated `2026-06-24` already exist** from an earlier execution (see merged branches `docs/branch-archival-dry-run-2026-06-24`, `ops/branch-archival-execution-2026-06-24`). Cross-check of the §D list:

| §D branch | Archive tag already present? |
|---|---|
| `audit/issue-110-github-governance-forensic-2026-06-23` | YES (`…/2026-06-24`) |
| `audit/issue-116-docs-truth-stacked-audit-2026-06-22` | YES |
| `docs/batch5-fk-count-fix` | YES |
| `docs/issue-115-live-staging-smoke-runbook-2026-06-22` | YES |
| `docs/issue-117-stale-branch-archival-plan-2026-06-23` | YES |
| `chore/actions-node24-readiness` | NO (would need a tag first) |
| `temp-pr125-merge` | NO (would need a tag first) |

Implication: for the 5 already-tagged branches, **history is already preserved** — only the local-branch deletion (`git branch -d`) remains, making them the safest possible first action. The 2 untagged ones follow the full tag-then-delete flow. Always re-verify tag presence before deleting (do not re-tag an already-tagged branch).

## E. BRANCHES / WORKTREES THAT NEED OWNER REVIEW (`KEEP_REVIEW` + KEEP_* not-merged)

### E1. Not merged into `origin/main` — preserve (may hold unique commits)

| Branch | Class | Reason |
|---|---|---|
| `ai/expert-review-queue-mvp`, `ai/flywheel-final-tail-closure`, `ai/gold-memory-mvp`(ahead1), `chore/ai-memory-layer-v1`, `chore/p2_1-server-chat-history`, `chore/web-ai-p0-panel`, `fix/prod-ai-secrets-no-var-conflict`, `fix/prod-ai-worker-secrets`, `fix/prod-vision-model-gpt4o-mini` | KEEP_AI | AI/Copilot work not in main |
| `audit/issue-114-middleware-security-stacked-audit-2026-06-22`, `claude/aistroyka-audit-security-infra-cg810i`(remote-only), `feat/p0-deps-and-security-headers`, `hotfix/middleware-matcher-and-headers` | KEEP_SECURITY | Security/auth work not in main |
| `design/liquid-glass-public-shell-lg2a`, `feature/unified-product-design-certification` | KEEP_DESIGN | Design re-slice sources (do not broad-merge) |
| `release/mobile-pilot-rc`(ahead12), `release/web-pilot-rc`, `release/publication-readiness-mega-sprint` | KEEP_RELEASE | RC sources |
| `release/phase5-2-1`(ahead19), `release/pilot-hardening-max`, `release/pilot-launch-pack`, `release/cloudflare-agent-starter-split`, `release/vercel-prod-hardening-2026-03-05` | KEEP_RELEASE | Older release lines — owner review before any action |
| `fix/ios-e2e-ci-secrets`, `fix/ios-e2e-phantom-push`, `fix/ios-e2e-workflow-push-phantom`, `fix/ios-e2e-workflow-yaml` | KEEP_MOBILE | iOS E2E work not in main |
| `audit/final-global-premerge-audit-2026-06-21`, `audit/issue-111-ai-flywheel-stacked-audit-2026-06-21`, `audit/issue-112-mobile-pilot-stacked-audit-2026-06-22`, `audit/issue-113-design-public-stacked-audit-2026-06-22`, `audit/issue-115-live-staging-smoke-stacked-audit-2026-06-22`, `audit/issue-117-stale-branch-archival-stacked-audit-2026-06-22`, `audit/issue-118-reports-export-ui-polish-stacked-audit-2026-06-22`(worktree) | KEEP_REVIEW | Audit branches not in main |
| `chore/close-post-merge-tails`(gone), `chore/enterprise-zero-trust`, `chore/phase13-operator-refresh`(gone), `chore/resilience-hardening-v2`, `chore/stabilization-p0`, `cursor-test`(ahead1), `docs/ios-e2e-ci-pass`(gone), `feat/dashboard-v1-api-paths`, `fix/vercel-build-stabilization` | KEEP_REVIEW | Unmerged / ambiguous |

### E2. Remote-only `cursor/*` + `claude/*` (cloud-agent generated) — KEEP_REVIEW

`cursor/aistroyka-system-maturity-7957` (**PROTECTED**), `cursor/android-platform-launch-b8bb`, `cursor/auth-and-dashboard-issues-eb7c`, `cursor/critical-bug-investigation-66e8`, `…-7dfb`, `…-c421`, `cursor/critical-correctness-bugs-20fe`, `…-2263`, `…-4030`, `…-7cfa`, `…-84c0`, `…-85e3`, `…-af15`, `cursor/development-environment-setup-b598`, `…-ba4b`, `cursor/discussion-status-silent-failure-c12b`, `cursor/technical-documentation-updates-569f` — may contain unmerged investigation work; owner per-branch decision only.

### E3. Remote-only `snapshots/*` (38 dated branches, 2026-03-15 → 2026-04-19) — KEEP_REVIEW (biggest single reduction opportunity)

Automated dated snapshots; many share SHAs. **Highest-volume cleanup**, but they may capture history not on `main`. Recommend owner confirm they are reproducible/obsolete, then bulk-archive (tag) before deletion. Do NOT bulk-delete without that confirmation (hard rule 7/8).

### E4. Worktrees needing review (minor untracked, not removed)

| Worktree | Branch | Changes | Recommendation |
|---|---|---|---|
| `AISTROYKA-git-archaeology-2026-06-20` | `audit/full-project-git-archaeology-2026-06-20` | 1 | Verify the 1 untracked file, then archive worktree |
| `AISTROYKA-integration-reconciliation-2026-06-20` | `audit/issue-118-…-stacked-audit` | 1 | Verify, then review |
| `AISTROYKA-main-postmerge-validation` | `postmerge-main` | 1 | Verify, then archive |
| `AISTROYKA-prod-hotfix-ed3e6b59` | detached `ed3e6b59` | 1 | Verify, detached — owner decide |
| `AISTROYKA-ci-fix` | detached `0c40ed50` | 0 | Detached, clean — owner decide |
| 22 × `AISTROYKA-*` post-merge worktrees | `post-merge-pr1NN` | 0–2 (mostly 1, likely `.DS_Store`) | Remove worktree (clean) → then branch becomes deletable in §C1 |

## F. Worktree → branch map (for ordering of any future cleanup)

Branches in §C cannot be deleted while checked out in a worktree. Remove the (clean) worktree first. Worktrees currently holding archive-candidate branches: `post-merge-pr127–pr148` map to `AISTROYKA-reports-export-polish`, `-docs-truth-index`, `-stale-branch-plan`, `-branch-archival-dry-run`, `-branch-archival-execution`, `-security-followup-audit`, `-security-page-header-tests`, `-truth-index-housekeeping`, `-design-public-followup-audit`, `-public-cta-i18n`, `-post-136-housekeeping`, `-homepage-mock-metrics-cleanup`, `-post-138-truth-index`, `-mobile-fresh-audit`, `-mobile-readiness-doc-refresh`, `-agents-learning-update-2026-06-26`, `-post-142-truth-index`, `-mobile-build-evidence-plan`, `-post-144-truth-index`, `-ios-simulator-evidence`, `-post-146-truth-index`, `-android-evidence-2026-06-26`. Plus `AISTROYKA-actions-refresh`→`fix/drop-redundant-indexes-batch2`, `AISTROYKA-clean-pr`→`fix/prod-auth-stabilization`, `AISTROYKA-auth-mainline`→`chore/actions-node24-readiness`.

## G. Exact commands that WOULD be used later — **DO NOT RUN NOW** (owner-gated)

```bash
# 0. Refresh view (safe, read-only network)
git fetch --all --prune --dry-run        # preview prune; drop --dry-run only after approval

# 1. Per ARCHIVE/DELETE candidate — TAG FIRST (history preserved)
git tag -a "archive/<branch>/2026-06-30" "<branch>" -m "archive before delete (dry-run approved)"
git push origin "archive/<branch>/2026-06-30"     # push tag only

# 2. Remove the (CLEAN) worktree holding the branch, before deleting the branch
git worktree remove "/Users/alex/Projects/AISTROYKA-<name>"   # refuses if dirty (do NOT add --force)

# 3. Delete the LOCAL branch with -d (refuses unmerged; never -D)
git branch -d "<branch>"

# 4. Delete the REMOTE branch (only for branches that still exist on origin)
git push origin --delete "<branch>"

# 5. Prune worktree admin entries whose dirs are gone
git worktree prune -v

# 6. Verify idempotency before any rerun
git branch --list "<branch>"            # expect empty
git tag --list "archive/<branch>/*"     # expect the archive tag
```

> Never run on: `main`, `cursor/aistroyka-system-maturity-7957`, `release/web-pilot-rc`, `release/mobile-pilot-rc`, any `[ahead N]` branch, any dirty worktree, or the `~/.cursor/worktrees/*` agent worktrees.

## H. Verdict

- **SAFE_TO_ARCHIVE_NOW: NO** — this is a dry run; no archival/deletion performed and none is safe without recorded owner approval for the specific list.
- **OWNER_APPROVAL_REQUIRED: YES** — owner must approve the §C (ARCHIVE_CANDIDATE) and §D (DELETE_CANDIDATE) lists before any tag/delete; §E remains KEEP/REVIEW.

### Suggested smallest safe first slice (after approval)
The §D list (7 branches: merged AND remote-gone) is the lowest-risk starting batch. Next, the §C1 `post-merge-prNNN` branches after their clean worktrees are removed. `snapshots/*` and `cursor/*` stay KEEP_REVIEW pending explicit owner confirmation.
