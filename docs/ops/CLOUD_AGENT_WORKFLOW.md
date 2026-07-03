# Cloud Agent Workflow — AISTROYKA

> How to drive real work from a phone (Cursor mobile / cloud agent) when there is no computer available.
> Designed so a desktop session can later resume the exact same branch with zero lost context.

## 1. The flow (phone, no computer)

1. **User starts a task from the phone** — describes the goal in one message.
2. **Cloud agent creates or reuses a task branch** from `origin/main`:
   `<type>/<short-kebab-topic>` (e.g. `fix/portal-invite-resend`). Never work directly on `main`.
3. **Agent reads context first:** `PROJECT_CONTEXT.md` → `STATUS.md` → latest `docs/handoff/*`.
4. **Agent opens a task file** `docs/tasks/<topic>.md` from `TASK_TEMPLATE.md` — fills scope, allowed files, out-of-scope, completion criteria.
5. **Agent works only inside the scoped branch and allowed files.**
6. **Agent runs validation** (cloud CI runs the full `ci-check` on the PR; locally-equivalent subset from `VALIDATION_CHECKLIST.md`).
7. **Agent creates a report / handoff** `docs/handoff/<date>-<topic>.md` from `HANDOFF_TEMPLATE.md`.
8. **Agent updates `STATUS.md`** (branch, commit, what passed/failed, next step, handoff link).
9. **User reviews on phone** — reads the handoff + the PR.
10. **Later, on Cursor Desktop**, the user checks out the same branch and continues from the handoff.

## 2. Naming rules

| Artifact | Pattern | Example |
|---|---|---|
| Branch | `<type>/<short-kebab-topic>[-issue-<N>][-<yyyy-mm-dd>]` | `feature/portal-invite-resend` |
| Task file | `docs/tasks/<type>-<topic>.md` | `docs/tasks/feature-portal-invite-resend.md` |
| Handoff file | `docs/handoff/<yyyy-mm-dd>-<topic>.md` | `docs/handoff/2026-06-30-portal-invite-resend.md` |
| Decision (ADR) | `docs/decisions/<yyyy-mm-dd>-<topic>.md` | `docs/decisions/2026-06-30-branch-model.md` |

`<type>` ∈ { `ops`, `feature`, `fix`, `release`, `audit` }.

## 3. Validation rules (cloud)

- The PR triggers `.github/workflows/ci-check.yml`: validate npm lock → install → i18n:check → lint → typecheck → test → release:check → cf:build (no deploy). This is the gate.
- Treat a green `ci-check` as the minimum bar before requesting merge.
- Do NOT mark work "done" while CI is red — fix or document the failure in the handoff.

## 4. When to STOP and ask the operator

Stop and document a blocker (do not guess / do not improvise) when:
- A secret or credential is missing.
- The change would touch tenant/auth/middleware/billing-gate logic or the customer-finance boundary.
- A production deploy or DB migration apply is implied.
- Branch protection blocks merge (needs a non-author approval).
- Scope is ambiguous, or the change would exceed the task's "allowed files".
- A destructive operation (delete, force, reset) seems required.

## 5. What a cloud agent must NEVER do

- Commit or print secrets; `git add .`; commit `.env*`, `evidence/`, `local-secrets/`, build artifacts.
- Push directly to `main`; force push; reset --hard; rewrite history; self-approve a PR.
- Deploy to production or staging by hand; apply DB migrations without explicit approval.
- Delete files/branches/worktrees outside the gated archival flow.
- Expand AI scope, refactor architecture, or redesign UI under an unrelated task.
- Claim store-live / GA / "deployed" without `buildStamp` / CI / upload evidence.

## 6. Resuming on desktop

Desktop agent: `git fetch`, checkout the task branch, read its `docs/tasks/*` + the latest `docs/handoff/*`, run local validation, continue. The handoff's "exact next step" is the entry point.
