# Reports Export Existing Patterns — 2026-06-20

## Auth Helper To Use
- `getTenantContextFromRequest(request)` from `@/lib/tenant`
- `requireTenant(ctx)` from `@/lib/tenant`
- `createClientFromRequest(request)` from `@/lib/supabase/server`

## Role / Access Helper To Use
- `canReviewReport(ctx)` from `@/lib/domain/reports/report.policy`
- `isLiteWorkerClient(ctx)` from `@/lib/tenant/client-profile`

Reason:
- Existing report review already uses `canReviewReport(ctx)`.
- Lite worker clients can be `member` role in this repo, so they must be explicitly blocked for export.

## Tenant / Project Helper To Use
- `getProject(supabase, ctx, projectId)` from `@/lib/domain/projects/project.service` when `project_id` is provided.

## Existing Report Query Pattern
- `GET /api/v1/reports` uses `listReportsForManager` and enriches reports with:
  - `media_count`
  - `analysis_status`
- The export implementation mirrors this shape but returns only safe CSV columns.

## Test Style To Follow
- Route tests mock tenant context, Supabase request client, policy helpers, and domain services with Vitest.
- Service tests validate pure CSV behavior separately.

## Contract Style To Follow
- Existing contract schemas cover worker report create/submit but not CSV export.
- For this slice, route/service tests are sufficient because success response is `text/csv`, not a JSON API shape.

## Decision On `project_id`
- `project_id` remains optional.
- If supplied, it is validated with `getProject`.
- If omitted, export is tenant-scoped to the current manager/admin context, matching current `/api/v1/reports` list behavior.
- No stakeholder/customer/worker access is allowed.
