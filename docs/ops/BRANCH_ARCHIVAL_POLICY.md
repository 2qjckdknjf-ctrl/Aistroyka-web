# Branch & Worktree Archival Policy — AISTROYKA

> Owner-gated, non-destructive-by-default policy for reducing branch/worktree sprawl without losing history.
> Aligns with AGENTS rules: dry-run → owner approval → annotated archive tags → docs-only execution PR with non-author APPROVED merge.

## 1. Principles

1. **Nothing is deleted without an owner approval recorded for that specific run.**
2. **History is never lost.** Before any branch deletion, an annotated tag `archive/<branch>/<yyyy-mm-dd>` is created pointing at the branch tip. The commits remain reachable via the tag.
3. **Unmerged work is preserved.** A branch with commits not contained in `origin/main` (or ahead of its own upstream) is never a delete candidate until proven obsolete AND owner-approved.
4. **When unsure → `KEEP_REVIEW`.**
5. **Dirty worktrees are never removed.** Any worktree with uncommitted/untracked changes is off-limits until the owner triages it.

## 2. Classification taxonomy

| Class | Meaning | Default action |
|---|---|---|
| `KEEP_ACTIVE` | Production truth / current work | Keep |
| `KEEP_RELEASE` | Release-candidate source of truth | Keep |
| `KEEP_SECURITY` | Security/auth/hardening work | Keep |
| `KEEP_AI` | AI/Copilot work (esp. unpushed) | Keep |
| `KEEP_MOBILE` | iOS/Android pilot/store work | Keep |
| `KEEP_DESIGN` | Liquid Glass / design system (re-slice source) | Keep |
| `KEEP_REVIEW` | Ambiguous, unmerged, ahead-of-upstream, or owner-protected | Keep, owner triage |
| `ARCHIVE_CANDIDATE` | Fully merged into `origin/main`, transient | Tag-then-delete **after owner approval** |
| `DELETE_CANDIDATE_ONLY_AFTER_OWNER_APPROVAL` | Merged + remote already gone + clearly obsolete | Tag-then-delete **after explicit owner approval** |

## 3. Never-touch list (hard)

- `main`, `origin/main` (production truth).
- `cursor/aistroyka-system-maturity-7957` (explicitly protected by AGENTS rules).
- Any branch with an **open PR**.
- Any branch marked dangerous / manual-review.
- Any branch `[ahead N]` of its upstream (unpushed commits) until pushed or owner-confirmed obsolete.
- Any **dirty** worktree, and the `.cursor/worktrees/*` Cursor agent worktrees.
- `release/web-pilot-rc`, `release/mobile-pilot-rc` (RC sources of truth).

## 4. Execution flow (future, owner-gated — NOT part of the dry-run)

```
1. DRY-RUN          → produce BRANCH_WORKTREE_ARCHIVAL_DRY_RUN.md (this step done)
2. OWNER APPROVAL   → owner signs off on the specific candidate list
3. ARCHIVE TAGS     → git tag -a archive/<branch>/<date> <branch> -m "archive before delete"
                      git push origin archive/<branch>/<date>   (tags only)
4. VERIFY           → confirm tag points at branch tip; confirm branch merged/obsolete
5. DELETE           → local:  git branch -d <branch>   (use -d, NOT -D; -d refuses unmerged)
                      remote: git push origin --delete <branch>
6. WORKTREES        → git worktree remove <path> only when clean; git worktree prune for missing
7. EXECUTION PR     → docs-only report of what was archived/deleted, merged via non-author APPROVED review
```

## 5. Idempotency / rerun safety

Before re-running execution: verify prior completion — target branches absent, archive tags present. Do not re-delete or re-tag already-processed branches.

## 6. Hard prohibitions

- No `git branch -D` (force delete) — use `-d` so unmerged branches are refused.
- No `git worktree remove --force` on dirty trees.
- No force push, no history rewrite, no remote branch deletion outside this flow.
- No deletion of `snapshots/*` or `cursor/*`/`claude/*` without explicit per-branch owner approval (may contain unmerged investigation work).
