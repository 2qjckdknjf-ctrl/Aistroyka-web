# Active Branches — Agent Memory

> Snapshot of relevant branches. **Trust `origin/main` for production.** Refresh on demand with `git branch -vv`.

**Last updated:** 2026-06-30 · `origin/main`: `fcbef354`

## Production

| Branch | Tip | Notes |
|---|---|---|
| `origin/main` | `fcbef354` | Production truth |
| `main` (local) | `c600b7e6` | **Stale + dirty** in `AISTROYKA-release-closure` — do not use |

## Recent ops/docs (merged or pushed)

| Branch | Status |
|---|---|
| `ops/branch-archival-dry-run` | Merged (#173) |
| `ops/branch-cleanup-slice-1` | Merged (#174) |
| `docs/status-slice-1-landed` | Merged (#175) |
| `audit/dirty-main-worktree-2026-06-30` | Merged (#176) |
| `docs/development-os` | **In progress** (this Dev OS PR) |

## Release / protected (do not delete)

| Branch | Notes |
|---|---|
| `release/web-pilot-rc` | Web RC source |
| `release/mobile-pilot-rc` | Mobile RC; `[ahead 12]` |
| `release/phase5-2-1` | `[ahead 19]` |

## Open PR branches

| Branch | PR |
|---|---|
| `cursor/critical-bug-investigation-66e8` | #119 |
| `ai/expert-review-queue-mvp` | #106 |
| `ai/gold-memory-mvp` | #104 |
| `ai/flywheel-final-tail-closure` | #103 |

## Refresh command

```bash
git fetch origin && git branch -vv | head -30
gh pr list --state open
```
