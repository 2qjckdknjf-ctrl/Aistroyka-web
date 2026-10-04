## Проверка до начала работы (2026-10-04)

- Read START_HERE.md, STATUS.md and docs/tasks/ACTIVE_WORK_REGISTRY.csv from current origin/main.
- Run `python3 scripts/ops/workspace_preflight.py --refresh`; when resuming, add `--resume-pr <number>`.
- Search main, existing PRs and local salvage by requirement ID before writing another implementation.
- Track implementation, current-head review, main, staging, production, DB migration and mobile build independently.
- Finish the current delivery and verification queues recorded in STATUS and the registry before starting another product queue; a blocked gate does not authorize duplicate implementation.
- Registry rows are dated observations: refresh HEAD/state before any action. Historical audits are evidence, not a live queue.


# Active Work Rules

> Rules that apply to **every** active task on every device.

## Must do

1. **Branch per task** — `<type>/<topic>` from `origin/main`
2. **Task file** — `docs/tasks/YYYY-MM-DD-<slug>.md` at start
3. **Handoff** — `docs/handoff/YYYY-MM-DD-<slug>.md` at pause/end
4. **Validation** — run relevant checks before PR
5. **PR per task** — protected merge path; non-author approval
6. **Update pointers** — `STATUS.md` + indexes when stopping
7. **Trust `origin/main`** over local stale checkouts

## Must not do

- Product features in docs-only tasks
- Cleanup (Slice 2+) without owner approval
- Touch dirty worktrees (`AISTROYKA-release-closure`, `~/.cursor/worktrees/*`)
- Delete branches with `[ahead N]` or without archive tags (policy)
- Commit secrets · `git add .` · force push · direct push to `main`
- Self-approve · bypass branch protection
- Deploy · DB apply · store upload without explicit owner go
- Claim store-live / GA / deployed without evidence

## Scope discipline

- If task says "docs only" → no app code, no config, no migrations
- If unsure → `KEEP_REVIEW` + document blocker; do not guess
- One task = one PR when possible (small, reviewable slices)

## Module tracking

| Module state | Meaning |
|---|---|
| **Active** | Current task in STATUS + current-focus |
| **Idle** | No in-progress task; safe to start new scoped work |
| **Blocked** | Owner action required; agent stops |

Update `docs/agent-memory/current-focus.md` when active module changes.
