# Operator Runbook — Safe Merge Under Branch Protection

**Date:** 2026-06-23  
**Applies after P0 remediation (`enforce_admins: true`)**

## Before opening a PR

- [ ] Scope is minimal and documented
- [ ] Author is not the sole approver
- [ ] CI Check workflow will run on PR

## Before merge — mandatory checks

### 1. Verify `reviewDecision`

```bash
gh pr view <PR_NUMBER> --json reviewDecision,reviews,author,state
```

**Required:** `reviewDecision: "APPROVED"`

If `REVIEW_REQUIRED` → **STOP**. Do not merge.

### 2. Confirm non-author APPROVED in reviews API

```bash
gh api repos/2qjckdknjf-ctrl/Aistroyka-web/pulls/<PR_NUMBER>/reviews \
  --jq '.[] | select(.state=="APPROVED") | {user: .user.login, state, submitted_at}'
```

**Required:** At least one `APPROVED` from a login **≠ PR author**.

Bot `COMMENTED` reviews (Cursor, Codex) **do not count**.

### 3. Confirm checks PASS

```bash
gh pr checks <PR_NUMBER> --watch=false
```

**Required:** `check` (CI Check) = pass. No pending required checks.

### 4. Confirm mergeable state

```bash
gh pr view <PR_NUMBER> --json mergeStateStatus,mergeable
```

**Required:** No BLOCKED state due to reviews or checks.

## Safe merge procedure

```bash
# Only after all checks above pass
gh pr merge <PR_NUMBER> --merge --delete-branch=false
```

Prefer **non-author** to click merge in GitHub UI if author is owner.

## If GitHub UI offers "Merge without waiting for requirements"

**STOP immediately.** This indicates admin bypass is still enabled.

- Do not merge
- Record screenshot + PR number in issue #110
- Verify `enforce_admins` setting
- Escalate to repo owner

## If author attempts self-approve

Expected error: `Can not approve your own pull request`

**Action:** Request review from a different GitHub user. Author must not use admin bypass.

## After merge

```bash
gh pr view <PR_NUMBER> --json mergedAt,mergeCommit,reviews,reviewDecision
git fetch origin main && git rev-parse origin/main
```

Record merge commit and confirm reviews API still shows non-author `APPROVED`.

## When to stop (hard stops)

| Condition | Action |
|-----------|--------|
| `reviewDecision: REVIEW_REQUIRED` | Stop — obtain approval |
| No `APPROVED` in reviews API | Stop |
| Only bot COMMENTED reviews | Stop — need human APPROVED |
| Required check pending/failing | Stop |
| Admin bypass merge offered | Stop — fix settings first |
| Large integration PR without 2+ reviewers | Stop — split or add reviewer |

## Current state caveat (pre-remediation)

Until **`enforce_admins: true`** is applied, owner **`2qjckdknjf-ctrl`** can merge without APPROVED reviews. Operators must **voluntarily** follow this runbook; GitHub will not enforce it for admins until P0 is applied.
