# Cloud Agent Startup Protocol

> **Mandatory** for every Cursor cloud agent session. Read before any work.

## 1. Read order (do not skip)

1. `PROJECT_CONTEXT.md` — product rules, stack, non-negotiables
2. `STATUS.md` — what is happening now
3. `PROJECT_DASHBOARD.md` — mobile dashboard, warnings, open PRs
4. `docs/dev-os/DEVELOPMENT_OS.md` — operating layer overview
5. `docs/agent-memory/current-focus.md` — active focus + blockers
6. Latest handoff in `docs/handoff/` (see `HANDOFF_INDEX.md`) — if any

## 2. Report before acting

After reading, the agent must state (in the chat):

```
Current branch: <name or detached>
Intended branch: <type>/<topic> from origin/main
Scope: <1–2 sentences>
Out of scope: <what will NOT be done>
Forbidden this session: <cleanup/deploy/secrets/etc.>
Validation plan: <commands to run before PR>
```

If the user said **"Continue current task"**, derive scope from the latest handoff + task file — do not invent new scope.

## 3. Branch rules

- Branch from `origin/main` (fetch first).
- One task = one branch = one task file = one handoff.
- Never work directly on `main`.
- If `main` is occupied in another worktree, create a new worktree/branch from `origin/main` — do not force-switch.

## 4. Stop and ask owner when

- Secret or credential missing
- Implied cleanup, deploy, DB migration, store upload
- Dirty worktree mutation
- Scope ambiguous or exceeds task "allowed files"
- Branch protection blocks merge (needs non-author approval)
- User request conflicts with `PROJECT_CONTEXT.md` rules

## 5. End of session

- Write handoff (`docs/handoff/YYYY-MM-DD-<slug>.md`)
- Update `STATUS.md`, `HANDOFF_INDEX.md`, relevant agent-memory files
- Push branch; open PR if ready; **do not self-approve**
