# PROJECT DASHBOARD — AISTROYKA

> Mobile-readable control panel. Read in under 60 seconds. **No secrets.**
> Last updated: 2026-06-30 · Trusted pointers: `STATUS.md`, `PROJECT_CONTEXT.md`, this file.

## Production truth

| Field | Value |
|---|---|
| **origin/main** | `fcbef354` |
| Domain | `aistroyka.ai` (prod) · `staging.aistroyka.ai` |
| Verify deploy | `GET /api/v1/health` → `buildStamp.sha7` |

## Active now

| Field | Value |
|---|---|
| **Active module** | Development OS setup (docs/process) |
| **Recommended branch** | `docs/development-os` (when working on Dev OS) |
| **Idle ops state** | Slice 1 landed · Slice 2 **NOT approved** |

## Open PRs (inspect before continuing)

| # | Branch | Title | Review |
|---|---|---|---|
| 119 | `cursor/critical-bug-investigation-66e8` | Fix partial invite membership provisioning | REVIEW_REQUIRED |
| 106 | `ai/expert-review-queue-mvp` | AI flywheel expert review queue MVP | REVIEW_REQUIRED |
| 104 | `ai/gold-memory-mvp` | AI flywheel Gold Memory MVP | REVIEW_REQUIRED |
| 103 | `ai/flywheel-final-tail-closure` | AI flywheel final tail closure | REVIEW_REQUIRED |

> Docs/ops PRs (#173–#176) are **merged**. No open docs PRs at last check.

## Blocked / warnings

| Warning | Status |
|---|---|
| **Dirty `main` worktree** | `AISTROYKA-release-closure` — 306 files, HEAD `c600b7e6` (452 behind main). **Do not reset.** See `docs/reports/DIRTY_MAIN_WORKTREE_AUDIT.md` |
| **Dirty cloud worktrees** | 7× `~/.cursor/worktrees/AISTROYKA/*` — never remove |
| **`[ahead N]` branches** | 7 branches with unpushed commits — never delete |
| **Supabase CLI** | Not installed locally — DB CLI ops blocked |

## Next owner action

1. Decide **salvage strategy** for dirty `main` worktree (recommended: preserve via salvage branch).
2. **Do not approve Slice 2** without separate dry-run + explicit go.
3. Review/close stale open PRs (#103–#119) if obsolete.

## Next agent action

1. Read `PROJECT_CONTEXT.md` → `STATUS.md` → this dashboard → `docs/dev-os/CLOUD_AGENT_STARTUP_PROTOCOL.md`.
2. Work only on a scoped branch from `origin/main`.
3. Open task file + handoff when pausing.
4. **Stop** if cleanup, deploy, or dirty-worktree mutation is implied.

## Safe commands (docs/validation)

```bash
git fetch origin
git status
git branch -vv
git worktree list
bun run i18n:check
bun run lint
bun run test
```

## Forbidden (unless owner explicitly approves)

- `git branch -D`, `git push --force`, `git reset --hard`
- `git push origin --delete`, `git worktree remove --force`, `git worktree prune`
- Branch/worktree cleanup (Slice 2+)
- Deploy, DB migration apply, store upload
- Touch dirty worktrees or `[ahead N]` branches
- Self-approve PRs · push directly to `main`

## Latest handoff

_None indexed yet — see `docs/handoff/HANDOFF_INDEX.md`._

## Latest audit reports

| Report | Topic |
|---|---|
| `docs/reports/DIRTY_MAIN_WORKTREE_AUDIT.md` | Dirty main worktree (on main) |
| `docs/reports/BRANCH_CLEANUP_SLICE_1_EXECUTION.md` | Slice 1 cleanup (on main) |
| `docs/reports/BRANCH_WORKTREE_ARCHIVAL_DRY_RUN.md` | Branch archival dry-run (on main) |
| `docs/reports/PROJECT_OPERATING_SYSTEM_SETUP_REPORT.md` | Operating system setup (local/untracked) |
