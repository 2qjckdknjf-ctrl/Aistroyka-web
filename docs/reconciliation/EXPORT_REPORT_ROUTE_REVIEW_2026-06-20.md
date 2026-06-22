# Export / Report Route Review — 2026-06-20

## Current Main Behavior
- `GET /api/v1/reports/[id]`: returns a tenant-scoped report with media.
- `PATCH /api/v1/reports/[id]`: manager review status update exists, with policy checks and audit emission.
- `GET /api/v1/reports/export`: not present in main.
- `GET /api/v1/projects/export`: not present in main.
- Export job handler in main exists but is not the immediate CSV route behavior from candidate branches.

## Outside-Main Behavior

| Route/function | Source | API shape | Auth/tenant enforcement | Side effects | Frontend/mobile dependency | Safe later | Blocker |
|---|---|---|---|---|---|---|---|
| `GET /api/v1/projects/export` | `release/mobile-pilot-rc`, `feature/unified-product-design-certification` | Immediate CSV response with `Content-Type`, `Content-Disposition`, private no-store cache | `getTenantContextFromRequest`, `requireTenant`, request-bound Supabase client | Calls `generateProjectsExportResponse` | Possible dashboard/mobile export feature | MANUAL | Need export service review, tenant scope tests, customer finance isolation |
| `GET /api/v1/reports/export` | `release/mobile-pilot-rc`, `feature/unified-product-design-certification` | Immediate CSV response; optional `project_id`, bounded `range_days` | `getTenantContextFromRequest`, `requireTenant`, request-bound Supabase client | Calls `generateReportsExportResponse` | Possible dashboard/mobile report export | MANUAL | Need export service review, route tests, role/tenant rules |
| `PATCH /api/v1/reports/[id]` review side effects | `release/mobile-pilot-rc`, `feature/unified-product-design-certification` | Existing review PATCH gains approval event, sync change, and notification side effects | Existing tenant/report review policy context | Adds `insertReportApprovalEvent`, `emitChange`, `notifyUser` | Mobile sync and worker report feedback may depend on this | MANUAL | Need DB table support confirmed and tests around duplicate/failed side effects |
| `notifyUser` helper | `release/mobile-pilot-rc` | Single-user notification insert helper | Tenant ID and target user passed by caller | Best-effort notification insert | Worker/manager notification UX | MANUAL | Must verify no cross-tenant notification insert |
| `runExportJob` job handler path | `release/mobile-pilot-rc` | Export job handler calls export service instead of placeholder | Job tenant context from job payload/service | Generates CSV/uploads result | Admin/export jobs | MANUAL | Need storage/service behavior and tenant path checks |

## Review Notes
- The export routes are additive and likely useful, but they are not safe to port blindly.
- The report PATCH side effects are behavior-changing, not just additive. They can affect mobile sync, notifications, and audit trails.
- These changes should be integrated in a backend/API implementation phase only after focused route tests are planned.

## Verdict
- Safe now: none.
- Safe later: export routes may be candidates after manual review.
- Manual review: all report review side effects.
- Blocked: any export/report route that depends on unverified storage, tenant scoping, or customer finance output.
