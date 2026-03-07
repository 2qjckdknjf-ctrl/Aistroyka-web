# Phase 3 Start — Manager Product Completion Audit

**Date:** 2026-03-07  
**Scope:** Current state before Phase 3 operational completion.

---

## What is already production-usable

- **Auth & identity:** Manager sends x-client: ios_manager; role gating via GET /api/v1/me (owner/admin/member).
- **Dashboard:** GET /api/v1/ops/overview — KPIs, needs-attention queues, pull-to-refresh.
- **Projects list:** GET /api/v1/projects — list with navigation to placeholder detail.
- **Tasks:** List (filters), detail, create (POST /api/v1/tasks); no assign in UI.
- **Reports:** List (project filter), report detail (GET /api/v1/reports/:id); read-only, no review actions.
- **Team:** GET /api/v1/workers — list and worker detail.
- **AI:** GET /api/v1/ai/requests — tenant-level job list; no per-project entry from project.
- **Design:** LoadingStateView, EmptyStateView, ErrorStateView, KPICard, SectionHeaderView, FilterChip.
- **Build:** AiStroyka Manager and AiStroykaWorker both build; no regressions.

---

## What still blocks daily manager workflow

1. **Project detail** — Placeholder only (name + id). Manager cannot see project summary, related tasks/reports, or jump to project-scoped AI.
2. **Task assign** — Backend POST /api/v1/tasks/:id/assign exists; no assign action or assignee picker in Manager.
3. **Report review** — No approve/review/request-changes actions; backend has no report state-change write for manager.
4. **Notifications** — Placeholder tab; no inbox API; device list exists (GET /api/v1/devices) but no notification center.
5. **Per-project AI** — GET /api/v1/projects/:id/ai exists; not wired from project detail or AI tab.
6. **Navigation coherence** — Dashboard “needs attention” and project detail do not consistently deep-link to tasks/reports/AI.

---

## Backend gaps vs iOS gaps

| Gap | Backend | iOS |
|-----|---------|-----|
| Project detail | GET /api/v1/projects/:id and GET /api/v1/projects/:id/summary exist; use createClient (Bearer fix needed) | Not wired; placeholder view only |
| Task assign | POST /api/v1/tasks/:id/assign exists; createClient fix needed | No assign UI or assignee picker |
| Report review | No manager report approve/review/state-change endpoint | Can only show shell + document need |
| Notifications | GET /api/v1/devices (device list); no notifications inbox endpoint | Placeholder; can show device list or shell |
| Per-project AI | GET /api/v1/projects/:id/ai exists | Not wired from project or AI tab |
| Assignee directory | GET /api/v1/workers returns user_ids (suitable as worker_id) | Not used for assign picker yet |

---

## Phase 3 priority order

1. **Project detail** — Wire GET /api/v1/projects/:id and GET /api/v1/projects/:id/summary; implement ProjectDetailView with metadata, summary, links to tasks/reports/AI.
2. **Task assign flow** — Wire POST /api/v1/tasks/:id/assign; assignee picker from GET /api/v1/workers; assign action in TaskDetailManagerView.
3. **Report review actions** — Audit backend; implement only supported writes; otherwise shell + PHASE3_BACKEND_GAPS.
4. **Notifications** — Real device list or notification-center shell; document missing inbox API.
5. **Per-project AI** — Wire GET /api/v1/projects/:id/ai; entry from project detail and/or AI tab.
6. **Manager UX refinement** — Reusable cards/badges/actions; refactor key screens; cross-module navigation and deep-flow coherence.
