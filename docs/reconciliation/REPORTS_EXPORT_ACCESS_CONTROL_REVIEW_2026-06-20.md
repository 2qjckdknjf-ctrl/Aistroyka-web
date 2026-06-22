# Reports Export Access Control Review — 2026-06-20

## Finding
Initial implementation blocked lite workers with `isLiteWorkerClient(ctx)` and used `canReviewReport(ctx)`, but this was not enough to prove worker blocking by authenticated role/membership.

In this repo, `canReviewReport(ctx)` delegates to project management permission, and `member` can satisfy some manager-like policies. A non-lite `member` request could be allowed if tests/mocks treated it as reviewer-capable.

## Risk
- Risk: P0/P1 tenant data exposure.
- A worker or non-admin tenant member could export tenant-scoped report CSV if access relied only on client profile or broad project management policy.

## File Reference
- `apps/web/app/api/v1/reports/export/route.ts`

## Fix
- Added explicit authenticated role gate:
  - only `owner` or `admin` may use this export route.
- Kept `isLiteWorkerClient(ctx)` as defense in depth.
- Kept `canReviewReport(ctx)` as compatibility with existing report review policy.
- Added test for a web `member` role with `canReviewReport` true: blocked with 403.

## Critical Questions
1. Anonymous access blocked: YES.
2. Worker access blocked by real role/membership, not only client header: YES, after fix.
3. Owner/customer access blocked: customer/stakeholder portal role blocked; tenant owner/admin remains allowed as internal tenant admin.
4. Stakeholder access blocked: YES.
5. Manager/admin scoped: YES, tenant context required; optional project checked.
6. Cross-tenant export possible: NO by route/service design; tenant ID comes from server context.
7. Cross-project export possible: project filter is validated; tenant-wide export allowed only to owner/admin.
8. Missing `project_id` scope: tenant-wide owner/admin export.
9. Tenant-wide export allowed for project managers: NO after fix, unless represented as tenant `owner`/`admin`.
10. Service-role leakage: NO; route uses request-bound Supabase client.

## Test Coverage
- Anonymous blocked.
- Lite worker blocked.
- Web `member` blocked even when `canReviewReport` returns true.
- Stakeholder blocked.
- Unauthorized role blocked.
- Project scope checked before export.
- Owner/admin allowed.

## Fix Needed
- YES, found and fixed.
