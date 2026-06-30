# Mobile Workflow — AISTROYKA

> Exact phone-driven workflow for Cursor mobile / cloud agents.

## User says: "Continue current task"

Agent must:

1. Read `PROJECT_DASHBOARD.md` → `STATUS.md` → latest handoff
2. Identify active branch + open PR (if any)
3. Fetch + checkout that branch
4. Continue **only if** handoff says safe for phone/cloud AND scope is clear
5. Otherwise **stop** and list exact owner action required
6. On pause/end: write handoff + update STATUS

## User says: "Start new task: <goal>"

Agent must:

1. Read context stack (startup protocol)
2. Create branch `<type>/<topic>` from `origin/main`
3. Create `docs/tasks/YYYY-MM-DD-<slug>.md` from template
4. Confirm scope + forbidden actions with user if ambiguous
5. Work scoped; validate; PR; handoff

## User says: "Review blocker on PR #N"

Agent must:

1. `gh pr view N` — state, checks, reviewDecision, author
2. Report: what blocks merge, what owner must do
3. **Do not merge** unless non-author approval path is available and CI green
4. Never self-approve

## User says: "Clean up branches" / "Run Slice 2"

Agent must:

1. **Stop immediately**
2. Reply: Slice 2 / cleanup not approved; refer to `BRANCH_ARCHIVAL_POLICY.md`
3. Offer: run dry-run audit only (docs), or wait for owner prompt

## Examples

| User intent | Safe? | Agent action |
|---|---|---|
| "Fix typo in STATUS.md" | Yes | Branch `docs/fix-status-typo`, docs-only PR |
| "Merge PR #174" | Conditional | Check author vs reviewer; non-author approve only |
| "Delete post-merge branches" | **No** | Stop; owner-gated Slice 2 |
| "Reset dirty main worktree" | **No** | Stop; salvage strategy required first |
| "Deploy to staging" | **No** | Stop; CI chain only, owner approval |

## Phone-friendly checks

```bash
git fetch origin && git log origin/main --oneline -1
git status -sb
gh pr list --state open
gh pr checks <N>
```

No build required for docs-only tasks. Full validation before product PRs.
