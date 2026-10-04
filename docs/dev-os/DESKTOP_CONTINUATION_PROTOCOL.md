# Desktop Continuation Protocol

> When the user returns to Mac and opens Cursor Desktop.

## 1. Startup (safe)

```bash
cd /Users/alex/Projects/AISTROYKA-main-clean   # after checking this checkout is available
python3 scripts/ops/workspace_preflight.py --refresh
```

Read: `PROJECT_DASHBOARD.md` → `STATUS.md` → latest handoff → task file.

## 2. Resume active branch

```bash
# First inspect current remote PR HEAD and preserve any local changes.
python3 scripts/ops/workspace_preflight.py --refresh --resume-pr <number>
# If RECONCILE_FIRST: reconcile the existing task instead of starting a duplicate.
```

If branch only exists locally, stay on it after fetch.

## 3. Validation before continuing product work

```bash
bun install --frozen-lockfile
bun run i18n:check
bun run lint
bunx --cwd apps/web tsc --noEmit
bun run test
# cf:build only if web build surface changed; needs NEXT_PUBLIC_* env
```

See `docs/ops/VALIDATION_CHECKLIST.md` for full list.

## 4. Continue work

- Follow task file scope
- Commit explicit paths only (never `git add .`)
- Push → PR → non-author review → protected merge

## 5. End session

- Write/update handoff
- Update `STATUS.md`, indexes, agent-memory
- Push branch

## Forbidden unless owner explicitly approves

```bash
git branch -D <branch>              # NEVER — use -d only in approved cleanup slices
git push origin --delete <branch>
git worktree remove --force <path>
git reset --hard
git push --force
git worktree prune                    # owner-gated
git tag ...                           # owner-gated archival flow
wrangler deploy / cf:deploy           # CI chain only
supabase db push                      # owner approval only
```

## Preserved worktrees

Primary `/Users/alex/Projects/AISTROYKA` is stale and dirty. `AISTROYKA-release-closure` is salvage-only. Cursor worktrees and mobile-store-m1 contain retained local material. Preserve them; use current origin/main through START_HERE.md. See workspace RESULT for archive paths and recovery.
