# Branch Snapshot — 2026-06-23

**Snapshot date:** 2026-06-23  
**Baseline:** `origin/main` @ `d7a0547c3b571d572434466a470dce8b180d6537`  
**Refs mutated:** **NO**

## Counts

| Metric | Count |
|--------|------:|
| Remote branches (`origin/*`, excl. `HEAD`) | 124 |
| Local branches (`refs/heads/*`) | 124 |
| Remote branches merged into `origin/main` | 86 |
| Remote branches not merged into `origin/main` | 37 |
| Open PR head branches (GitHub API) | 5 |

## Read-only commands used

```bash
git fetch --all --tags --prune
git branch -r --sort=-committerdate
git branch --sort=-committerdate
git for-each-ref --format='%(refname:short)|%(committerdate:iso8601)|%(objectname:short)|%(subject)' refs/remotes/origin
git for-each-ref --format='%(refname:short)|%(committerdate:iso8601)|%(objectname:short)|%(subject)' refs/heads
git branch -r --merged origin/main
git branch -r --no-merged origin/main
gh pr list --state open --json headRefName
```

Outputs were captured under `/tmp/aistroyka-*` during plan authoring (not committed).

## Open PR branches (keep active)

| Branch | Notes |
|--------|-------|
| `cursor/critical-bug-investigation-66e8` | Open PR work |
| `design/liquid-glass-public-shell-lg2a` | Open PR; design broad surface |
| `ai/expert-review-queue-mvp` | Open PR; AI surface |
| `ai/gold-memory-mvp` | Open PR; AI surface |
| `ai/flywheel-final-tail-closure` | Open PR; AI surface |

## Notes

- `--merged origin/main` is necessary but **not sufficient** for safe deletion (branch may still be referenced by open PRs, release tags, or operator workflows).
- Local branch count includes many stale checkout copies; local deletion is also **out of scope** for this plan.
- Classification heuristics are documented in `02_BRANCH_CLASSIFICATION_2026-06-23.md`.
