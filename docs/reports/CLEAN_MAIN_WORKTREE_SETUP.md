# Clean Main Worktree Setup

> Read-only setup record for the clean main worktree policy.
> Date: 2026-07-01

## Purpose

Provide a **fresh, clean** desktop checkout at production truth (`origin/main`) while preserving the legacy `AISTROYKA-release-closure` worktree and salvage branch unchanged.

## Configuration

| Field | Value |
|---|---|
| **Clean worktree path** | `/Users/alex/Projects/AISTROYKA-main-clean` |
| **HEAD** | `2b4c4e53` — Merge PR #177 (Development OS) |
| **Branch state** | Detached HEAD @ `origin/main` (local `main` remains checked out in `AISTROYKA-release-closure`) |
| **Working tree** | Clean |
| **Created from** | `origin/main` @ `2b4c4e53` |

## Commands used

```bash
git fetch origin
git worktree add /Users/alex/Projects/AISTROYKA-main-clean origin/main
```

## Legacy worktree (untouched)

| Field | Value |
|---|---|
| Path | `/Users/alex/Projects/AISTROYKA-release-closure` |
| Branch | `salvage/dirty-main-release-closure-2026-07-01` @ `4d3f10c7` |
| Status | Clean; salvage preserved on remote |

## Not done

- No delete/reset/clean/prune of old worktree
- No salvage merge/cherry-pick
- No Slice 2 · no deploy

## Recommended daily use

```bash
cd /Users/alex/Projects/AISTROYKA-main-clean
git fetch origin
# optional: git switch -c ops/my-task origin/main  # branch new work from here
```

For protected merges and status, use `PROJECT_DASHBOARD.md` + `STATUS.md` on this checkout.

## Optional follow-ups (owner-gated)

1. Create local branch `main-clean` tracking `origin/main` in this worktree if detached HEAD is awkward.
2. Land this report via docs-only PR from primary repo if desired.
3. Eventually retire `AISTROYKA-release-closure` worktree **only** after owner confirms salvage reviewed.
