# Report Review Current Behavior Inventory — 2026-06-20

## Route File
- `apps/web/app/api/v1/reports/[id]/route.ts`

## Service / Helper Files
- `apps/web/lib/domain/reports/report.repository.ts`
- `apps/web/lib/domain/reports/report.policy.ts`
- `apps/web/lib/observability/audit.service.ts`
- `apps/web/lib/tenant/client-profile.ts`

## Allowed Statuses
- `approved`
- `rejected`
- `changes_requested`

## Request Body Shape
```json
{
  "status": "approved | rejected | changes_requested",
  "manager_note": "optional string or null"
}
```

## Auth / Tenant / Project Checks
- Route resolves tenant context with `getTenantContextFromRequest`.
- Route requires tenant with `requireTenant`.
- Route checks review permission with `canReviewReport`.
- Repository update is tenant-scoped and only updates reports currently in `submitted` state.
- Existing code did not defensively reject lite worker clients in the route itself; this review adds coverage and a minimal guard.

## Audit Log Behavior
- On successful review, route calls `emitAudit` with:
  - `action: report_review`
  - `resource_type: report`
  - `resource_id: <report id>`
  - `details.status`
  - `details.has_note`
- Audit is best-effort and should occur only after a successful report update.

## Current Tests
- Unauthorized reviewer returns 403.
- `changes_requested` without note returns 400.
- null update result returns 404.
- successful review returns updated report payload and emits audit.

## Known Gaps Before This Slice
- No route-level test for lite worker client trying PATCH.
- No explicit test for invalid status.
- No explicit audit-not-created assertions for unauthorized/invalid/404 paths.
- No explicit audit payload details assertions.
- No test for all allowed transitions.
