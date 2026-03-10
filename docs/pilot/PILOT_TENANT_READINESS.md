# Pilot Tenant Readiness

**Phase 6 — Pilot Deployment & Observability**

---

## Pilot tenant setup checklist

- [ ] **Tenant created** in system (tenant record; owner user).
- [ ] **Owner** has verified email and can sign in (web + optional mobile).
- [ ] **Environment** for pilot agreed (staging vs production).
- [ ] **Invitations** sent for managers and workers (invite flow; accept-invite).
- [ ] **Roles** assigned: at least one owner; managers (admin/member) for team leads; workers for field.
- [ ] **Projects** created as needed (at least one project for pilot).
- [ ] **Tasks** created under project(s) for workers to receive and report on.
- [ ] **Mobile apps** (iOS Worker, iOS Manager) configured with correct API base URL and distributed (TestFlight) to pilot users.
- [ ] **Support channel** defined: who receives feedback, how (email, chat, form), and how to share request_id / version/build.

---

## Seed / demo data strategy

- **Option A — Minimal:** One project, a few tasks, one manager, one or two workers. Enough to run through: assign task → worker reports → manager reviews.
- **Option B — Realistic:** Multiple projects and tasks, several workers, to stress sync and notifications.
- **Seeding:** Use Supabase dashboard or idempotent scripts to insert tenant, users, project, tasks. Do not seed production with fake PII; use staging for full demo data.
- **Document:** Where and how seed data is created (e.g. “Staging: run script X or use dashboard”) so onboarding is repeatable.

---

## Manager onboarding checklist

- [ ] Receive invite; accept via link (web or deep link).
- [ ] Sign in to **web dashboard** and/or **iOS Manager**.
- [ ] Verify: can see project(s), team, tasks, reports inbox.
- [ ] Perform: assign a task to a worker; open a report; perform a review action (e.g. approve).
- [ ] Verify: worker receives task (and push if enabled); report state updates.
- [ ] Know where **Settings / Diagnostics** are to capture version and request_id for support.

---

## Worker onboarding checklist

- [ ] Receive invite or sign-up; sign in to **iOS Worker** (or web if applicable).
- [ ] Verify: can see project, today’s tasks, sync status.
- [ ] Start shift; create and submit a report (with photo if applicable).
- [ ] Verify: report appears for manager; upload completes (no pending forever).
- [ ] Know where **Support / Diagnostics** are to capture device id, sync status, last error for support.

---

## Minimum required roles/users

- **1 owner** (tenant creator; full access).
- **1+ manager** (admin or member) for task assignment and report review.
- **1+ worker** for creating reports and receiving tasks.
- **Optional:** viewer for read-only stakeholders.

---

## Minimum required project/task/report data

- **1 project** (name, tenant_id).
- **2+ tasks** (title, status, project_id, assignable to worker).
- **1+ report** (submitted by worker, linked to task or project) to validate full flow: create → submit → review.

---

## Pilot success criteria

- **Functional:** Workers can sign in, see tasks, submit reports; managers can assign tasks and review reports; sync and upload complete without persistent failures.
- **Observability:** Request_id and logs allow support to trace at least one reported issue end-to-end.
- **Stability:** No critical regressions (auth, tenant context, report submit, upload, notifications); crash-free sessions acceptable for pilot scope.
- **Feedback:** At least one round of structured feedback (bugs, UX, feature requests) captured and classified per PILOT_FEEDBACK_LOOP.md.

---

## Scripts / seeds / admin helpers

- **Current:** No dedicated pilot seed script in repo. Tenant and project creation can be done via Supabase dashboard or existing invite/sign-up flows.
- **Documented:** Use staging for demo data; production pilot uses real tenant and minimal real data.
- **Optional:** Add a minimal script (e.g. `scripts/pilot-seed-staging.ts`) that creates one tenant, owner, project, tasks, and optionally invites, when approved; keep it idempotent and staging-only.
