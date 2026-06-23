# Root Cause Analysis

**Date:** 2026-06-23

## Primary classification

**`OWNER_BYPASS_ALLOWED` + `GITHUB_UI_MERGE_WITH_ADMIN_BYPASS`**

**Confidence:** **HIGH**

## Evidence chain

1. Branch protection on `main` sets `required_approving_review_count: 1` and required check `check`.
2. **`enforce_admins.enabled: false`** — administrators are **not** subject to branch protection rules.
3. Sole collaborator with admin: **`2qjckdknjf-ctrl`** — same account is **author and merge actor** on all four affected PRs.
4. GitHub API shows `reviewDecision: REVIEW_REQUIRED` and **no** `state: APPROVED` reviews (only bot `COMMENTED` or empty).
5. Issue timelines show `merged` events with actor **`2qjckdknjf-ctrl`**.
6. Attempted self-approve via `gh pr review --approve` fails with: `Can not approve your own pull request` — so owner used **bypass merge**, not self-approval.

## Ruled out or secondary

| Classification | Verdict | Reason |
|----------------|---------|--------|
| `REQUIRED_REVIEWS_NOT_ENABLED` | **NO** | Reviews required (count = 1) |
| `REQUIRED_REVIEW_COUNT_ZERO` | **NO** | Count is 1 |
| `RULESET_NOT_TARGETING_MAIN` | **NO** | No rulesets; classic protection targets `main` |
| `BYPASS_ACTOR_CONFIGURED` (ruleset) | **NO** | No rulesets |
| `CHECKS_REQUIRED_BUT_REVIEWS_NOT_REQUIRED` | **NO** | Both required when protection applies |
| `API_REVIEW_DECISION_STALE` | **PARTIAL** | `reviewDecision` correctly shows REVIEW_REQUIRED; merge still occurred via bypass |
| `UNKNOWN_NEEDS_OWNER_SETTINGS_REVIEW` | **NO** | Settings are readable; root cause identified |

## Why self-approve is impossible but merge still happened

GitHub blocks authors from submitting `APPROVED` on their own PRs. That is **correct behavior**.

However, repo **admins** with **`enforce_admins: false`** can click **Merge** in the GitHub UI (or use admin-equivalent API paths) **without** an approving review. GitHub records the merge but **does not fabricate** an `APPROVED` review in the reviews API.

## Why `COMMENTED` is not `APPROVED`

Bot reviews from `cursor[bot]`, `chatgpt-codex-connector[bot]` use `state: COMMENTED`. GitHub branch protection counts only **`APPROVED`** (and in some configs `APPROVED` from eligible reviewers). COMMENTED reviews **do not satisfy** `required_approving_review_count`.

## How GitHub allowed merge (per PR)

| PR | Likely bypass path |
|----|-------------------|
| #109 | Owner admin merge; 4 bot COMMENTED reviews insufficient |
| #120 | Owner admin merge; zero reviews |
| #122 | Owner admin merge; zero reviews |
| #124 | Owner admin merge ~11s after bot COMMENTED; CI still in progress |

## PR #124 additional note

Merge timestamp precedes CI Check completion — consistent with **admin bypass** overriding strict status check requirement at merge time (or merge initiated while check appeared green on UI). Post-merge API shows check eventually PASS.

## Issue #110 status

**Not resolved.** Protection rules exist on paper but **do not bind administrators**. Repeated owner merges without recorded approval are **expected** under current settings, not API bugs.
