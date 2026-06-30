# Operator Actions — Agent Memory

> Actions only the **owner/operator** can decide. Agents document and stop.

**Last updated:** 2026-06-30

## Pending owner decisions

| Action | Priority | Context |
|---|---|---|
| **Salvage dirty main worktree** | High | 306 files @ `AISTROYKA-release-closure`; recommended: salvage branch. Audit on main: `docs/reports/DIRTY_MAIN_WORKTREE_AUDIT.md` |
| **Approve Slice 2** | Medium | Only after separate dry-run + explicit prompt; not authorized now |
| **Review stale open PRs** | Medium | #103–#106, #119 — close or continue? |
| **Install Supabase CLI** | Low | Or confirm MCP-only DB workflow |
| **Store uploads** | Low | TestFlight/Play owner-gated (`OWNER_ACTION_REQUIRED`) |

## Operator can delegate to agent (with approval)

- Non-author PR review + protected merge (when reviewer identity available)
- Docs-only PRs for audits/reports
- Dry-run inventories (read-only)

## Operator must not delegate blindly

- Branch/worktree deletion (Slice 2+)
- Reset/stash of dirty worktrees
- Production deploy outside CI chain
- DB migration apply
- Billing gate changes (`ENTITLEMENT_RESOLUTION_SOURCE`)
- Store console mutations

## After operator decides

Agent updates: `STATUS.md`, `PROJECT_DASHBOARD.md`, handoff, this file.
