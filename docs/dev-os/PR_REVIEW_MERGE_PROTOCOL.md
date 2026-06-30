# PR Review & Merge Protocol

> Protected-path merges only. Aligns with branch protection on `main`.

## Requirements (all must pass)

1. PR targets `main`
2. CI Check (`check`) **pass**
3. **Non-author** `APPROVED` review (`reviewDecision: APPROVED`)
4. No merge conflicts (`mergeable: MERGEABLE`)
5. Author must **not** self-approve

## Reviewer identities

| Identity | Use |
|---|---|
| `2qjckdknjf-ctrl` | Non-author reviewer (keyring / separate session) |
| `6262265-cpu` | Often PR author — **cannot approve own PR** |
| `GITHUB_REVIEWER_TOKEN` | Maps to `6262265-cpu` — same self-approval block |

When author = reviewer token, switch to keyring account:

```bash
env -u GH_TOKEN -u GITHUB_TOKEN gh auth switch --user 2qjckdknjf-ctrl
env -u GH_TOKEN -u GITHUB_TOKEN gh pr review <N> --approve --body "..."
env -u GH_TOKEN -u GITHUB_TOKEN gh pr merge <N> --merge --delete-branch=false
```

Verify before merge:

```bash
gh pr view <N> --json reviewDecision,mergeStateStatus,mergeable
```

## Merge options

- Prefer `--merge` (merge commit) for audit trail
- Default `--delete-branch=false` unless repo policy requires delete
- Never bypass branch protection · never admin-merge · never force-push to `main`

## After merge

1. Confirm `origin/main` tip updated
2. Update `STATUS.md` / `PROJECT_DASHBOARD.md` / `docs/agent-memory/open-prs.md` if applicable
3. Do not start cleanup/deploy unless separately authorized

## Docs-only PRs

Same protocol applies. CI still runs (fast for docs-only changes).
