# Wave 4 Step 16 — Workload scope inventory

## A1 — Actionable domains inspected

| Domain | Included in Step 16 | Source of truth |
|--------|---------------------|-----------------|
| Approvals / pending reports | Yes (aggregate queue) | `project-summary` pending report approvals count |
| Document decisions | Yes | `pendingDecisionsCount` on project summary |
| Stakeholder discussions | Yes (manager + stakeholder) | `project_stakeholder_discussions` by status |
| Change orders | **No** | Deferred — no stable workload signal wired in this step |
| Handover blockers | Yes | `computeHandoverReadinessFromSummary` |
| Defects / punch list (blocking) | Yes | Handover blockers code `blocking_punch_defects` |
| Aftercare / warranty | Yes | `project_service_requests` non-closed counts |
| Portfolio critical / attention | Yes (leadership) | `buildPortfolioControl` (`portfolioState === "critical"`) |
| Overdue milestones | Yes | `overdueMilestonesCount` on project summary |
| Budget vs planned | Yes | `budgetOverBudget` on project summary |
| Client requests (action required) | Yes (stakeholder) | `project_client_requests` open + `action_required` |

## A2 — Audiences (minimal justified set)

- **Managers** (`canManageProjects`): execution inbox across tenant-visible projects (cap 25).
- **Stakeholders**: projects from `listActiveProjectIdsForUser` — client requests + discussions awaiting stakeholder.
- **Leadership**: tenant `owner` / `admin` only — portfolio-critical projects from existing portfolio control.

## A3 — Workload item capture

See `WorkloadItem` in `apps/web/lib/domain/workload/workload.types.ts`:

- `kind`, `audience`, `priority`, `title`, `reason`
- `project_id` / `project_name` (nullable for tenant-wide aggregates)
- `linked_entity_type` / `linked_entity_id` where applicable
- `action_url` — deep link to tab or screen
- `due_state`, `status_bucket`

## A4 — Explicitly deferred

- Personal assignment planner, calendar sync, reminder engine
- ML / AI prioritization
- Company-wide work OS, generic task DB
- Android-specific workload surfaces
- Full change-order workload until a single canonical “open CO” signal exists in summary layer
