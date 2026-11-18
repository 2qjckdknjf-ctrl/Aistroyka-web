# Working Model — AISTROYKA Project Operating System

> How work flows across Cursor Desktop and Cursor mobile/cloud agents without losing context.

## 1. Core idea

Every unit of work is **anchored to four artifacts** so it survives device switches and agent handoffs:

1. **A branch** — `<type>/<topic>` from `origin/main`.
2. **A task file** — `docs/tasks/<...>.md` (from `TASK_TEMPLATE.md`).
3. **Validation** — the relevant subset of `VALIDATION_CHECKLIST.md`.
4. **A handoff** — `docs/handoff/<...>.md` (from `HANDOFF_TEMPLATE.md`) + an updated `STATUS.md`.

No work lives only in local memory or only on one device. If it isn't in a branch + docs, it doesn't exist.

## 2. The two entry points

| Entry | When | What it can do |
|---|---|---|
| **Cursor Desktop** | At a computer | Full local validation, builds, mobile (Xcode/Gradle), git/PR ops, optional gated deploy/DB via operator. |
| **Cursor mobile / cloud agent** | Away from computer | Scoped branch work, edits, validation that runs in cloud CI, PRs, docs/status updates. No local-only state. |

Both read the **same** files: `PROJECT_CONTEXT.md` → `STATUS.md` → latest `docs/handoff/*`.

## 3. Lifecycle of a task

```
START  → read PROJECT_CONTEXT.md + STATUS.md + latest handoff
       → create/checkout branch from origin/main
       → open docs/tasks/<topic>.md (define scope + allowed files)
WORK   → make scoped changes only
CHECK  → run VALIDATION_CHECKLIST.md subset
SHIP   → commit explicit paths → push → open PR (protected merge path)
HANDOFF→ write docs/handoff/<date>-<topic>.md → update STATUS.md
PAUSE/END → STATUS.md links the handoff; safe to resume on any device
```

## 4. Source-of-truth precedence

1. Live code / runtime / CI evidence (highest).
2. `STATUS.md` (what's happening now) + latest handoff.
3. `PROJECT_CONTEXT.md` + `AGENTS.md` (durable facts/rules).
4. Older reports/docs (lowest — may be stale).

When 1 and 4 disagree, trust 1 and update the doc.

## 5. Hard boundaries (apply on every device)

- No secrets; no `git add .`; explicit paths only.
- No force push / reset --hard / history rewrite; no direct push to `main`.
- No production deploy or DB migration apply without explicit owner approval + the CI chain.
- Don't break dashboard/auth/middleware/tenant logic or the customer-finance boundary.
- If blocked or unclear → document the blocker in the task/handoff; do not guess.

## 6. Related docs

- `CLOUD_AGENT_WORKFLOW.md` — phone-driven flow in detail.
- `TASK_TEMPLATE.md` / `HANDOFF_TEMPLATE.md` — the per-task artifacts.
- `VALIDATION_CHECKLIST.md` — what to run before shipping.
- `GIT_BRANCH_OPERATING_AUDIT.md` — branch model + hygiene.
- `SCRIPTS_INVENTORY.md` — which scripts are safe where.
