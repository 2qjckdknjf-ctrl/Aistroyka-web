# Export / Report Implementation Plan — 2026-06-20

## 1. Exact Routes To Implement Later
- `GET /api/v1/reports/export`

Do not implement:
- `GET /api/v1/projects/export`
- customer/stakeholder export routes
- legacy `/api/reports/export`

## 2. Exact Files Likely To Change Later
- New route:
  - `apps/web/app/api/v1/reports/export/route.ts`
- New service/helper:
  - `apps/web/lib/platform/exports/report-export.service.ts` or equivalent
- Tests:
  - `apps/web/app/api/v1/reports/export/route.test.ts`
  - service-level CSV tests under `apps/web/lib/platform/exports/`
- Optional later contract additions:
  - `packages/contracts/src/schemas/reports.schema.ts` or existing schema file if query/error envelope is formalized

## 3. Contracts Required
- Query contract:
  - optional `project_id: string`
  - optional `from: ISO date`
  - optional `to: ISO date`
  - optional `range_days: integer 1..365`
- Error envelope:
  - `{ error: string, code?: string }`
- CSV response contract:
  - content type
  - fixed header columns
  - no JSON body on success

## 4. Tests Required First
Implement failing tests before route code:
- anonymous blocked
- worker blocked
- stakeholder/customer blocked
- wrong tenant blocked
- wrong project blocked
- manager/admin allowed
- CSV has exact safe columns
- CSV excludes forbidden finance keys and notes
- empty result behavior
- existing report routes still pass

## 5. Access Rules
- `requireTenant(ctx)` required.
- `canReviewReport(ctx)` or equivalent manager/admin/project-manager rule required.
- Optional `project_id` must be validated as tenant/project accessible for the current actor.
- Lite worker clients must receive 403.
- No service-role bypass for response filtering.

## 6. CSV Columns
Allowed:
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

## 7. Forbidden Fields
- all internal finance fields from `customer-finance-guard`
- `manager_note`
- `worker_note`
- media URLs/storage paths
- tenant-wide data outside current tenant
- project data outside optional project scope
- PII beyond stable user IDs already visible to manager/admin

## 8. Side Effects
- None.
- Route must be read-only.
- Do not add audit writes, notifications, sync changes, export jobs, or storage uploads in first slice.

## 9. Validation Commands
After implementation later:
- `bun run lint`
- `bun run build:contracts` if contracts change
- `bun run test -- --run`
- `bun run build`
- `bun run cf:build`
- focused route test command may also be run for faster iteration

## 10. Rollback Plan
- Single route/service/test commit.
- Revert commit to remove export route.
- No migration rollback required because first slice must not include schema changes.
- No feature flag required if route is not linked from UI yet, but route can also be guarded by a server-side feature flag if desired.

## 11. Explicitly Out Of Scope
- project export
- finance export
- customer/stakeholder export
- frontend/mobile UI
- report review side-effect changes
- AI routes
- migrations
- middleware
- deployment
