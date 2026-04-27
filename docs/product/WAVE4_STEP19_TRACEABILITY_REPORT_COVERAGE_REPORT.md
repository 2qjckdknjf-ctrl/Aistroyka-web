# Wave 4 Step 19 — Report approval trace coverage closure (Stage B)

## B1 — Linkage pathways (schema-aligned)

| Path | Mechanism |
|------|-----------|
| Task | `worker_reports.task_id` → `worker_tasks.project_id` |
| Document | `project_documents.report_id` (document belongs to project) |
| Day | `worker_reports.day_id` → **`worker_day.project_id`** (must match project) |

The application already assumed `worker_day.project_id` in `report-list.repository` and `countSubmittedReportsForProject`; the base migration predated the column.

## B2 — Fix applied

1. **Migration** `20260407120000_worker_day_project_id.sql`: adds nullable `worker_day.project_id` FK to `projects` + partial index. **Real FK**, no inference.
2. **Traceability repository:** After loading task- and document-linked report IDs, loads **`worker_day` rows** for `(tenant_id, project_id)` and fetches **`worker_reports.id`** where `day_id` ∈ those day ids. Merges into the same `reportIdSet` used for `report_approval_events`.

## B3 — Coverage improvement

- **Before:** Day-only reports without `task_id` or `project_documents.report_id` were invisible to project traceability.
- **After:** Day-only reports are included **when** the corresponding `worker_day` row has **`project_id` set** for that project (same rule as other manager features).

## B4 — Honest limitations

- Historical **`worker_day` rows with `project_id` null** still cannot be tied to a project without a data migration or client backfill; those reports remain out of project-scoped trace until the field is populated by worker apps when starting a day.
