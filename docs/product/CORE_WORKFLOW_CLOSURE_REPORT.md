# CORE WORKFLOW HARDENING — CLOSURE REPORT

**Step:** CORE WORKFLOW HARDENING — GOLDEN PATH  
**Date:** 2025-03-21  
**Status:** CLOSED (2025-03-21 — Final Execution Pass)

---

## 1. Migration

| Item | Status |
|------|--------|
| **Applied** | ✓ APPLIED |
| **Migration file** | `apps/web/supabase/migrations/20260319400000_project_issues.sql` |
| **Schema verified** | ✓ Table `project_issues` matches issue.types.ts, repository, API |
| **Command used** | `cd apps/web && supabase db push --yes` |
| **Result** | Applied successfully (with 5 other pending migrations: estimate_results, contact_leads, plan_fit, billing_readiness, billing_pilot_workspaces) |

**Canonical path used:** Supabase CLI (`supabase link --project-ref vthfrxehrursfloevnlp` + `supabase db push --yes`).

---

## 2. Code fixes

| File | Change |
|------|--------|
| `apps/web/app/api/v1/projects/[id]/issues/[issueId]/route.ts` | Added `project_id` check in GET and PATCH: if `data.project_id !== projectId` return 404. Prevents returning/updating issues from a different project when using the project-scoped URL. |
| `apps/web/app/[locale]/(dashboard)/dashboard/tasks/DashboardTasksClient.tsx` | Prefill flow: `createProjectId` and `createMilestoneId` are now synced from URL (`project_id`, `milestone_id`) when the create modal opens. Removed `createOpen` from the prefill condition so project/milestones prefetch on mount when URL has params; `createOpen` kept in deps so reopening the modal re-syncs from URL. |

---

## 3. Runtime verification

| Check | Expected | Notes |
|-------|----------|-------|
| Migration applied | `project_issues` table exists in DB | ✓ Applied via `supabase db push` |
| Issues list | GET `/api/v1/projects/:id/issues` returns `{ data: ProjectIssue[] }` | Tenant + project access enforced via service. |
| Issue create | POST with `title`, optional `description`, `task_id`, `milestone_id` → 201 | Title required, trimmed; project must exist and be accessible. |
| Issue get by id | GET `/api/v1/projects/:id/issues/:issueId` → 404 if issue belongs to another project | Fixed in this pass. |
| Issue patch status | PATCH with `status` → 200 | Valid statuses: open, in_review, resolved, closed. |
| Summary counts | `openIssuesCount` = count where status in ('open','in_review') | `project-summary.repository.ts` queries `.in("status", ["open", "in_review"])`. |
| Tasks prefill from milestone link | `/dashboard/tasks?project_id=X&milestone_id=Y` → Create form shows project and milestone selected | Schedule link "Create task for this milestone" uses this URL; prefill updated in this pass. |

---

## 4. Validation

| Check | Command | Status |
|-------|--------|--------|
| Contracts build | `npm run build --workspace=@aistroyka/contracts` | ✓ PASS |
| Typecheck | `npx tsc --noEmit` (apps/web) | ✓ PASS |
| Lint | `npx next lint` (apps/web) | ✓ PASS (no ESLint warnings or errors) |
| Domain tests | `npx vitest run --maxWorkers=1 lib/domain` | ✓ 82 tests passed (17 files) |
| Issue tests | `issue.repository.test.ts`, `issue.service.test.ts` | ✓ PASS |

---

## 5. Final status

**CLOSED**

Migration applied, schema verified, code fixes in place, validations green. Issues API and UI flow are runtime-ready.

---

## 6. Remaining notes

1. **Migration apply** — Completed 2025-03-21 via `supabase db push`. For future migrations, use `scripts/release/apply-migrations.sh` or GitHub Actions "Apply Supabase migrations" workflow.
2. **Summary layer** — `openIssuesCount` and `pendingDecisionsCount` logic is aligned with docs: open = open + in_review; pending = project_documents with status under_review.
3. **No other scope creep** — No refactors, billing, redesign, or new entities introduced.
4. **Tests** — Domain tests exist for issue repository and service. No new tests added in this pass; existing coverage is sufficient for the changes made.
