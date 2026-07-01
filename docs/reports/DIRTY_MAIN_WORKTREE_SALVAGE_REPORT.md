# Dirty Main Worktree — Salvage Report

> **Salvage only.** No reset, no clean, no merge to `main`, no Slice 2.
> Date: 2026-07-01 · `origin/main` at time of salvage: `2b4c4e53`

## Summary

The dirty state of worktree `AISTROYKA-release-closure` (branch `main` @ stale `c600b7e6`, 306 tracked changes) was preserved on remote branch `salvage/dirty-main-release-closure-2026-07-01` plus local patch backups. **`main` was not cleaned or fast-forwarded.**

## Original state

| Field | Value |
|---|---|
| Worktree path | `/Users/alex/Projects/AISTROYKA-release-closure` |
| Branch (before) | `main` |
| HEAD (before) | `c600b7e6` — Merge PR #12 (May 2026) |
| Behind `origin/main` | ~452 commits |
| Dirty files | 306 tracked (174 deleted, 132 modified; 0 untracked) |
| Net diff | +858 / −21754 lines |

## Salvage artifacts

| Artifact | Value |
|---|---|
| **Salvage branch** | `salvage/dirty-main-release-closure-2026-07-01` |
| **Salvage commit** | `600caaca` — `salvage: preserve dirty main release closure worktree` |
| **Patch backup** | `/Users/alex/Projects/AISTROYKA-salvage-backups/dirty-main-release-closure-2026-07-01.patch` (~1.1 MB) |
| **Status backup** | `…/dirty-main-release-closure-2026-07-01.status.txt` |
| **Diffstat backup** | `…/dirty-main-release-closure-2026-07-01.diffstat.txt` |
| **Remote push** | **YES** — `origin/salvage/dirty-main-release-closure-2026-07-01` |

## File count by change type

| Type | Count |
|---|---|
| Deleted (D) | 174 |
| Modified (M) | 132 |
| **Total** | **306** |

## Top risky areas (for later review — not resolved here)

1. **`apps/web/supabase/migrations/*`** — 3 migration files in salvage diff
2. **`apps/web/middleware.ts`** — auth/tenant gate changes
3. **174 deleted web/iOS sources** — many files still exist on current `origin/main` (divergent reduction, not main's history)
4. **`AGENTS.md`, `.gitignore`, `bun.lock`** — config drift
5. **`messages/*.json`** — i18n bundle changes

## What was NOT done

- `main` **not** fast-forwarded to `origin/main`
- No reset, stash, clean, prune, or Slice 2
- No merge PR opened (salvage is preservation/review only)
- Other worktrees untouched

## Worktree state after salvage

- Worktree now on **`salvage/dirty-main-release-closure-2026-07-01`**, **clean** (changes committed)
- Local ref **`main`** still at **`c600b7e6`** (unchanged tip; dirty working tree no longer on `main` because commit lives on salvage branch)

## Verdict

| Question | Answer |
|---|---|
| Data preserved? | **YES** — remote branch + local patch backups |
| `main` cleaned/updated? | **NO** |
| Safe to update local `main` later? | **YES** — after switching this worktree off `main` or using a fresh worktree from `origin/main`; review salvage diff before any merge decision |

## Recommended next step

1. **Owner review** salvage branch diff on GitHub (`salvage/dirty-main-release-closure-2026-07-01`) — decide if any commits are worth cherry-picking vs. obsolete.
2. **Free the worktree for `main`:** either keep using this checkout on salvage branch, or `git switch main` (now clean at `c600b7e6`) and then recreate/update `main` from `origin/main` in a **new clean worktree** (preferred: do not ff 452 commits on occupied dirty path).
3. Do **not** merge salvage into `main` without explicit owner approval and conflict analysis.
