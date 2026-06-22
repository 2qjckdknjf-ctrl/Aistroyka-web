# Reports Export Safe Next Slice Plan

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Recommended Next Tiny PR

After PR #109 merges and `main` validation passes:

**Reports export UI affordance polish only.**

Do not change backend route, CSV schema, or role gates.

## Proposed Scope

Safe polish options:

- improve button spacing/responsive wrapping
- add a small download icon or visually clearer affordance
- optionally show export action during Reports tab loading, only if tests prove behavior
- add helper/tooltip text explaining "Project reports CSV"

## Expected Files If Approved Later

Possible files:

- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- `apps/web/messages/{en,ru,es,it}.json` if copy changes
- optionally a focused UI/helper test if rendering behavior changes

Avoid:

- `apps/web/app/api/v1/reports/export/route.ts`
- `apps/web/lib/domain/reports/report-export.service.ts`
- CSV column list
- role helper broadening
- top-level reports export UI
- project export CSV
- customer/stakeholder export

## Required Tests

- `apps/web/components/projects/reports-export-ui.test.ts`
- `apps/web/app/api/v1/reports/export/route.test.ts`
- `apps/web/lib/domain/reports/report-export.service.test.ts`
- project detail tab tests if tab behavior is touched
- `bun run i18n:check` if copy changes
- full validation

## Must Remain Unchanged

- owner/admin-only UI visibility
- backend owner/admin-only authorization
- worker/lite/member/viewer/stakeholder/customer denial
- `project_id`-only UI URL
- CSV columns
- no free text notes
- no media URLs
- no finance/customer/stakeholder fields

## Slice Verdict

Next safe polish slice: small visual affordance/spacing/copy improvement after PR #109 merge.

Safe before PR #109 merges: NO.
