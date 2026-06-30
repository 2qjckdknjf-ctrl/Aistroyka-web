# Desktop Continuation Protocol

> When the user returns to Mac and opens Cursor Desktop.

## 1. Startup (safe)

```bash
cd /Users/alex/Projects/AISTROYKA   # or your active worktree
git fetch origin
```

Read: `PROJECT_DASHBOARD.md` → `STATUS.md` → latest handoff → task file.

## 2. Resume active branch

```bash
git checkout <active-branch>      # from handoff/STATUS
git pull --ff-only origin <active-branch>   # if tracking remote
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

## Dirty worktree note

`main` at `/Users/alex/Projects/AISTROYKA-release-closure` is **dirty (306 files)** and stale. **Do not** checkout/reset there. Use `origin/main` as truth; work from other worktrees/branches.
