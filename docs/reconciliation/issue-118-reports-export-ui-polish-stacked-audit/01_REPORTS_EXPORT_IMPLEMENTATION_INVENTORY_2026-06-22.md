# Reports Export Implementation Inventory

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Backend Route Files

- `apps/web/app/api/v1/reports/export/route.ts`
- `apps/web/app/api/v1/reports/export/route.test.ts`
- `apps/web/lib/domain/reports/report-export.service.ts`
- `apps/web/lib/domain/reports/report-export.service.test.ts`

## Frontend UI Files

- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/page.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- `apps/web/components/projects/reports-export-ui.ts`
- `apps/web/components/projects/reports-export-ui.test.ts`
- `apps/web/components/projects/ProjectSubnav.tsx`
- `apps/web/components/projects/ProjectSubnav.test.ts`

## i18n Keys

Relevant keys exist in `en`, `ru`, `es`, and `it`:

- `dashboardDetail.exportCsv`
- `dashboardDetail.exportProjectReportsCsv`
- `dashboardDetail.openReports`
- `dashboardDetail.projectSubnavAria`

## Current Export Flow

1. Project detail server page resolves tenant role with `getActiveTenantRoleForUser`.
2. Server page maps role through `canShowProjectReportsExport`.
3. Client receives boolean `canExportReports`.
4. Project Reports tab renders `ProjectReportsExportAction` when `canExportReports` is true.
5. Export link points to `/api/v1/reports/export?project_id=<project_id>`.
6. Backend validates authenticated tenant context, owner/admin role, non-lite client, `canReviewReport`, project scope, query filters, and then returns CSV.

## Current UI Placement

The export action is rendered inside the Project Reports tab only. It appears before the table and also before the empty state so owner/admin can export a header-only CSV when no reports exist.

## Runtime / PR Evidence

PR #109 evidence records:

- Project Reports tab works.
- Owner/admin Export CSV UI is visible.
- Export URL uses `/api/v1/reports/export?project_id=<project_id>` with only `project_id`.
- CSV export returns 200.
- CSV headers are exactly `report_id,project_id,worker_user_id,status,created_at,submitted_at,reviewed_at,media_count,analysis_status`.
- Sampled CSV excludes forbidden cost/budget/margin/finance/note/media URL/email/phone/customer/stakeholder fields.
- Non-owner role gate verification passed for export UI/API in PR comments.

## Inventory Verdict

Implementation is intentionally narrow and security-first. Issue #118 is polish only, not a correctness or merge-blocker issue.
