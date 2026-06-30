# AISTROYKA Development OS

> The operating layer for managing AISTROYKA from **phone**, **Cursor cloud agents**, and **desktop** without losing context.
> Docs + process only. Complements `PROJECT_CONTEXT.md`, `STATUS.md`, and `docs/ops/*`.

## 1. What this is

Development OS is not product code. It is the **discipline + file structure** that lets any agent or human:

- know what is live (`origin/main`)
- know what is active (task, branch, PR)
- continue work across devices
- stop safely when blocked
- never lose context in local-only state

## 2. Core artifacts (every task)

| Artifact | Location | When |
|---|---|---|
| Master context | `PROJECT_CONTEXT.md` | Read first (safe to share) |
| Live status | `STATUS.md` | Read second; update on pause/end |
| Dashboard | `PROJECT_DASHBOARD.md` | Mobile control panel |
| Task | `docs/tasks/YYYY-MM-DD-<slug>.md` | Open at task start |
| Handoff | `docs/handoff/YYYY-MM-DD-<slug>.md` | Write at pause/end |
| Decision | `docs/decisions/DECISION_LOG.md` | When a durable choice is made |
| Agent memory | `docs/agent-memory/*` | Current focus, risks, rules |

## 3. Device entry points

| Device | Start here |
|---|---|
| **Phone / cloud agent** | `docs/dev-os/MOBILE_WORKFLOW.md` + `CLOUD_AGENT_STARTUP_PROTOCOL.md` |
| **Desktop (Mac)** | `docs/dev-os/DESKTOP_CONTINUATION_PROTOCOL.md` |
| **PR merge** | `docs/dev-os/PR_REVIEW_MERGE_PROTOCOL.md` |

## 4. Lifecycle

```
START  → read context stack (see CLOUD_AGENT_STARTUP_PROTOCOL.md)
       → create/checkout branch from origin/main
       → open docs/tasks/YYYY-MM-DD-<slug>.md
WORK   → scoped changes only
CHECK  → validation subset (docs/ops/VALIDATION_CHECKLIST.md)
SHIP   → push → PR → non-author approval → protected merge
HANDOFF→ docs/handoff/YYYY-MM-DD-<slug>.md + update STATUS.md + indexes
```

## 5. Hard boundaries (all surfaces)

- No secrets in docs · no `git add .` · no force push · no direct push to `main`
- No cleanup/deploy/DB apply without owner approval
- Customer-finance boundary (see `PROJECT_CONTEXT.md`)
- When unsure → stop, document blocker, classify `KEEP_REVIEW`

## 6. Related docs

- `docs/ops/WORKING_MODEL.md` — cross-device working model (prior art)
- `docs/ops/CLOUD_AGENT_WORKFLOW.md` — cloud agent flow (prior art)
- `docs/ops/BRANCH_ARCHIVAL_POLICY.md` — branch hygiene policy
- `docs/ops/TASK_TEMPLATE.md` / `HANDOFF_TEMPLATE.md` — detailed templates
