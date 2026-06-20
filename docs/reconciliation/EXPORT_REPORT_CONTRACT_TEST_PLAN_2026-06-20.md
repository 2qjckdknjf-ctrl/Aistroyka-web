# Export / Report Contract Test Plan — 2026-06-20

Tests must be written before implementing export/report route changes.

## A. Auth Tests
- Anonymous `GET /api/v1/reports/export` returns 401.
- Wrong tenant cannot export reports.
- Wrong project ID returns 403 or 404 consistently.
- Worker receives 403 for report export.
- Stakeholder receives 403 for manager/admin report export.
- Manager/admin can export only tenant/project-scoped report rows.

## B. Data Isolation Tests
- Tenant A export never includes tenant B reports.
- Project A export never includes project B reports.
- Stakeholder export is not implemented in first slice.
- Customer/owner export is not implemented in first slice.
- Service-role helper, if used internally, still filters by tenant/project and safe columns.

## C. CSV / Export Tests
- Response `Content-Type` is `text/csv; charset=utf-8` or equivalent.
- Response has safe `Content-Disposition`.
- Response has `Cache-Control: private, no-store`.
- CSV includes only approved columns:
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
- CSV excludes:
  - `planned_amount`
  - `actual_amount`
  - `margin`
  - `profitability`
  - `budget_pressure`
  - `cost_overrun`
  - `subcontractor_cost`
  - `ai_finance_risk`
  - `manager_note`
  - `worker_note`
  - media URLs
- Empty export returns header row only or a documented empty CSV response.

## D. Report Review Tests
- Existing approve transition still works.
- Existing reject transition still requires manager note.
- Existing `changes_requested` transition still requires manager note.
- Existing audit log behavior still occurs.
- No cross-tenant review.
- Side-effect expansion tests must be added before approval-history/sync/notification changes:
  - approval event appended once
  - sync update emitted once
  - notification target is report author in same tenant
  - side-effect failure behavior documented

## E. Contract Tests
- Request schema for export query:
  - optional `project_id`
  - optional bounded `from`
  - optional bounded `to`
  - optional bounded `range_days`
- Response schema for CSV headers.
- Error envelope for 401/403/404/400.
- `/api/v1` canonical route behavior.
- No legacy export route in first slice.

## F. Regression Tests
- Existing `GET /api/v1/reports` still works.
- Existing `GET /api/v1/reports/[id]` still works.
- Existing `PATCH /api/v1/reports/[id]` still works.
- Existing worker create/submit report flow still works.
- Mobile lite allow-list remains unchanged; export route is not allowed for lite workers.
- Dashboard report list remains compatible.

## Validation Commands
- `bun run lint`
- `bun run build:contracts`
- `bun run i18n:check` only if user-visible strings change
- `bun run test -- --run`
- `bun run build`
- `bun run cf:build`
