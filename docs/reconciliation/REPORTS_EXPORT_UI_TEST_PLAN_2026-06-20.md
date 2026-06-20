# Reports Export UI Test Plan — 2026-06-20

## A. Visibility
- Export UI visible for tenant owner/admin when project Reports tab is rendered.
- Export UI hidden for worker/member context.
- Export UI hidden for owner/customer/stakeholder context.
- Export UI absent for anonymous/no dashboard context.

## B. Safety
- No finance/cost/budget labels.
- No customer/stakeholder export label.
- No project export label.
- No AI/admin links.
- No media URL or notes export language.

## C. URL
- Link/action points to `/api/v1/reports/export`.
- Includes `project_id` for selected project.
- Includes only safe supported params.
- Does not include forbidden params.

## D. i18n
- Button/aria labels exist in en/ru/es/it.
- `bun run i18n:check` passes.

## E. Regression
- Reports list still renders.
- Project subnav still renders.
- No broad DashboardShell nav changes.

## Test Implementation Notes
- Prefer a pure helper test for export URL generation if component role context is hard to render.
- If UI receives `canExportReports` prop later, test true/false visibility without mocking global auth.
