# Reports Export UI Implementation Plan — 2026-06-20

## Selected Placement
- Project Reports tab inside project detail.

## Files To Modify Later
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- possibly a small helper under `apps/web/components/projects/` for export URL generation
- messages en/ru/es/it if aria label added
- focused tests for helper/component visibility

## Helper Function
Suggested:
- `buildProjectReportsExportHref(projectId: string): string`
- returns `/api/v1/reports/export?project_id=<encoded projectId>`
- tests assert no forbidden params.

## Role Gating Logic
- First visible UI must be owner/admin-only.
- Do not infer permission from client headers.
- If owner/admin context is not available in project detail client, do not show the button until a safe server-derived prop is available.
- Do not broaden backend policy.

## URL Generation
- Required: `project_id`.
- Optional status/date filters: defer.
- No project export endpoint.

## i18n Keys
- Reuse `dashboardDetail.exportCsv` if possible.
- Add `dashboardDetail.exportProjectReportsCsv` only if an aria-label needs specificity.

## Tests To Add Later
- helper URL generation
- forbidden params absent
- owner/admin visible if role prop exists
- worker/stakeholder/customer hidden if role prop exists
- i18n parity

## Validation
- `bun run lint`
- `bun run i18n:check`
- focused tests
- `bun run test -- --run`
- `bun run build`
- `bun run cf:build`

## Rollback Plan
- Revert a single UI commit.
- No backend, migration, or data rollback.

## Out Of Scope
- project export
- finance export
- customer/stakeholder export
- project manager visibility unless backend/UI policy is explicitly updated later
- AI
- mobile
- Liquid Glass
- public redesign
