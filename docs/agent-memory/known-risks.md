# Known Risks — Agent Memory

> Durable risks agents must respect. Update when reality changes.

**Last updated:** 2026-06-30

## Critical (never-touch without owner)

| Risk | Detail |
|---|---|
| **Dirty main worktree** | `/Users/alex/Projects/AISTROYKA-release-closure` — `main` @ `c600b7e6`, **306 uncommitted files**, 452 commits behind `origin/main`. Do not reset/ff. Report: `docs/reports/DIRTY_MAIN_WORKTREE_AUDIT.md` |
| **Dirty cloud worktrees** | 7× `~/.cursor/worktrees/AISTROYKA/*` — live agent scratch; never remove |
| **`[ahead N]` branches** | 7 branches with unpushed commits — never delete |
| **Never-touch prefixes** | `main`, `release/*`, `ai/*`, `design/*`, `mobile/*`, `security/*`, `cursor/*`, `claude/*`, `snapshots/*` |

## Operational

| Risk | Detail |
|---|---|
| **Branch/worktree sprawl** | ~193 local branches, 39 worktrees — use STATUS/dashboard, never guess active branch |
| **Supabase CLI missing** | Local migration list/diff blocked; MCP alternative |
| **Migration timestamp skew** | Repo↔remote migration history may diverge — reconcile before CLI push |
| **Self-approval trap** | `6262265-cpu` often author; use `2qjckdknjf-ctrl` for non-author review |

## Product / security

| Risk | Detail |
|---|---|
| **Customer-finance boundary** | Never expose internal contractor financials on customer surfaces |
| **Billing gates** | Do not flip `ENTITLEMENT_RESOLUTION_SOURCE` until staged gates pass |
| **Stale open PRs** | #103–#106, #119 may be obsolete — verify before continuing |
