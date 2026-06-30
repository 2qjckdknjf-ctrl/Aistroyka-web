# Current Focus — Agent Memory

> Durable pointer for agents. Update when active module changes. Not a secret store.

**Last updated:** 2026-06-30

## Active module

**Development OS setup** — building `docs/dev-os/*`, `PROJECT_DASHBOARD.md`, agent-memory, indexes.

## Recently completed (on main)

- Project Operating System docs (PR #173)
- Branch archival dry-run + policy (PR #173)
- Branch cleanup Slice 1 (PR #174) — 5 local branches deleted
- STATUS sync after Slice 1 (PR #175)
- Dirty main worktree audit (PR #176)

## Not started / blocked

| Item | State |
|---|---|
| **Slice 2** branch cleanup | NOT approved — separate owner dry-run + go required |
| **Dirty main worktree salvage** | Audit on main; owner must choose preserve/stash/clean/abandon |
| **Supabase CLI** | Not installed locally |

## Trusted pointers

- Production: `origin/main` @ `fcbef354`
- Status: `STATUS.md` on main
- Dashboard: `PROJECT_DASHBOARD.md` (this Dev OS PR adds it)

## Next agent action (after Dev OS lands)

Follow `CLOUD_AGENT_STARTUP_PROTOCOL.md`; do not start Slice 2 or dirty-worktree cleanup without owner prompt.
