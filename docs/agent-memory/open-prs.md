# Open PRs — Agent Memory

> Refresh with `gh pr list --state open`. Last inspected: 2026-06-30.

## Open (product / AI — verify before continuing)

| PR | Branch | Title | Review | URL |
|---|---|---|---|---|
| #119 | `cursor/critical-bug-investigation-66e8` | Fix partial invite membership provisioning | REVIEW_REQUIRED | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/119 |
| #106 | `ai/expert-review-queue-mvp` | feat(ai-flywheel): expert review queue MVP | REVIEW_REQUIRED | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/106 |
| #104 | `ai/gold-memory-mvp` | feat(ai-flywheel): Gold Memory MVP retrieval layer | REVIEW_REQUIRED | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/104 |
| #103 | `ai/flywheel-final-tail-closure` | chore(ai-flywheel): close final feedback gating tails | REVIEW_REQUIRED | https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/103 |

## Recently merged (docs/ops)

| PR | Topic | Merge commit |
|---|---|---|
| #173 | Branch archival dry-run + policy | `d997c0df` |
| #174 | Slice 1 cleanup execution record | `27b7d49a` |
| #175 | STATUS after Slice 1 | `5bfdc3b0` |
| #176 | Dirty main worktree audit | `fcbef354` |

## Refresh

```bash
gh pr list --state open --json number,title,headRefName,reviewDecision,url
gh pr list --state merged --limit 5
```
