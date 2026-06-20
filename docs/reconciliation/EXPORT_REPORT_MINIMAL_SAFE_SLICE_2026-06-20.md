# Export / Report Minimal Safe Slice — 2026-06-20

## Selected Option
Option B: project reports export only, no customer finance, manager/admin only, strict tests.

## Exact Slice
- Add later: `GET /api/v1/reports/export`
- Scope:
  - tenant owner/admin/project manager only
  - optional `project_id`
  - bounded date/range filtering
  - no customer/stakeholder access
  - no worker access
  - no finance fields
  - no notes/free-text fields
  - no media URLs

## Allowed CSV Columns
- `report_id`
- `project_id`
- `worker_user_id`
- `status`
- `created_at`
- `submitted_at`
- `reviewed_at`
- `reviewed_by`
- `media_count`
- `analysis_status`

## Why Not Other Options
- Option A is too broad if it is tenant-wide without project controls.
- Option C is safer than implementation, but current tests already cover core review behavior; the first useful implementation can be read-only export if tests are written first.
- Option D is too conservative for manager/admin report export, but remains true for customer/stakeholder finance export.

## Out Of Scope
- `GET /api/v1/projects/export`
- customer export
- stakeholder export
- finance CSV
- report review side effects
- notifications
- sync changes
- export jobs/storage upload
- PDF export
- legacy route support
- frontend/mobile UI
- AI export/dataset code

## First Implementation Rule
Before any route implementation, add failing tests for auth, tenant/project scoping, CSV safe columns, forbidden fields, and empty export behavior.
