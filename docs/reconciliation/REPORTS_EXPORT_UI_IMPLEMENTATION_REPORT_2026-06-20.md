# Reports Export UI Implementation Report — 2026-06-20

## Placement
- Project Reports tab only.

## Files Changed
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/page.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- `apps/web/components/projects/reports-export-ui.ts`
- `apps/web/components/projects/reports-export-ui.test.ts`
- `apps/web/messages/{en,ru,es,it}.json`

## Role Context Decision
- Safe owner/admin role context is resolved in the server page and passed as `canExportReports`.
- Fail-closed if role cannot be resolved.

## UI Rendered
- YES, only when `canExportReports` is true.

## URL Helper
- `buildProjectReportsExportHref(projectId)`
- emits `/api/v1/reports/export?project_id=<encoded>`.

## i18n Labels
- Reuses `dashboardDetail.exportCsv`.
- Adds `dashboardDetail.exportProjectReportsCsv` for aria-label.

## Tests
- URL helper and role helper tests added.

## Validation
See `REPORTS_EXPORT_UI_VALIDATION_2026-06-20.md`.

## Out Of Scope Kept
- Top-level tenant-wide export UI.
- Project export.
- Finance export.
- Customer/stakeholder export.
- Project manager visibility.
- AI.
- Mobile.
- Liquid Glass.
- Public redesign.

## Next Step
- After validation, review UI behavior and consider browser/dashboard smoke when a local server/env is available.
