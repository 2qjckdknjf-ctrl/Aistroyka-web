# Reports Export Test Plan — 2026-06-20

## A. Auth Tests
- Anonymous request is blocked.
- Lite worker client is blocked.
- Unauthorized role is blocked.
- Stakeholder/customer-style role is blocked.
- Manager/admin request is allowed.

Implemented in:
- `apps/web/app/api/v1/reports/export/route.test.ts`

## B. Tenant / Project Isolation Tests
- Project-filtered export calls `getProject` before exporting.
- Project access failure returns 403 and does not call export service.
- Export service is called with tenant ID from tenant context only.

Implemented in:
- `apps/web/app/api/v1/reports/export/route.test.ts`

## C. CSV Safety Tests
- Content type is CSV.
- Response is private attachment.
- Header uses approved safe columns only.
- Forbidden finance fields are absent.
- Notes/comments are absent.
- Media URLs/storage fields are absent.
- Empty export returns header-only CSV.
- Formula injection values are prefixed.

Implemented in:
- `apps/web/app/api/v1/reports/export/route.test.ts`
- `apps/web/lib/domain/reports/report-export.service.test.ts`

## D. Route Behavior Tests
- `GET /api/v1/reports/export` returns CSV.
- `project_id`, `status`, and `range_days` are passed into export service.
- Invalid project scope is blocked before data export.

## E. Regression Tests
- Existing report route tests remain in full suite.
- No report review route behavior was changed.
