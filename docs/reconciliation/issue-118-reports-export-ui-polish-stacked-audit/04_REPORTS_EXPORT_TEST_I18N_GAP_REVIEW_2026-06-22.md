# Reports Export Test and i18n Gap Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Existing Tests

Backend:

- `apps/web/app/api/v1/reports/export/route.test.ts`
  - anonymous blocked
  - workers/lite clients blocked
  - member/viewer/stakeholder blocked
  - invalid query filters rejected
  - project scope validated before export
  - private CSV attachment returned
  - tenant-wide export only for owner/admin

- `apps/web/lib/domain/reports/report-export.service.test.ts`
  - approved safe column set
  - header-only CSV for empty exports
  - forbidden finance/notes/media URL columns excluded
  - CSV escaping
  - spreadsheet formula injection guard

Frontend helpers:

- `apps/web/components/projects/reports-export-ui.test.ts`
  - owner/admin only
  - project-scoped URL only
  - no forbidden scopes/filters

Related:

- `apps/web/app/api/v1/reports/[id]/route.test.ts`
  - report review authorization and invariants
- `ProjectSubnav` tests
- project detail tab tests

## Missing UI Tests

Missing:

- DOM/component rendering test proving the export link appears for `canExportReports=true`
- DOM/component rendering test proving it is hidden for false
- loading state behavior decision test if future polish shows export during loading
- empty state rendering test showing export appears before/with empty state
- responsive/mobile visual smoke

Current absence is acceptable because helper tests and runtime evidence cover PR #109 scope.

## Missing Role Tests

Route/helper tests cover core roles. Future polish that broadens role visibility must add:

- project manager allowed/denied matrix, if policy changes
- tenant owner/admin positive UI rendering test
- member/viewer/stakeholder/customer hidden UI tests
- direct API denial tests remain green

## Missing i18n / ARIA Tests

Existing i18n keys exist in all locale bundles and `i18n:check` passes for checked namespaces.

Future polish should add or preserve:

- aria label key in all locales
- no missing `dashboardDetail.*` messages
- visible label remains short enough for narrow UI
- no English-only copy in client component

## Required Regression Tests for Future Polish PR

Minimum future polish test plan:

- existing route export tests
- report export service tests
- reports export UI helper tests
- project subnav tests
- project detail tab tests
- `i18n:check`
- full test suite/build/cf:build

If adding DOM rendering tests, introduce them consistently with existing repo test patterns.

## Gap Verdict

Test/i18n gaps are P2 polish gaps, not PR #109 blockers.
