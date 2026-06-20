# Reports Export UI Test Plan Execution — 2026-06-20

## URL Helper Tests
- Builds `/api/v1/reports/export?project_id=...`.
- Includes `project_id` exactly once.
- Encodes project ID safely.
- Does not include `status`, `from`, `to`, `range_days`.
- Does not include finance/customer/stakeholder/media/notes params.

## Visibility Tests
- Pure role helper allows only `owner` and `admin`.
- `member`, `viewer`, `stakeholder`, `null`, and `undefined` are denied.
- Full DOM rendering was not added because existing test infrastructure does not use React Testing Library patterns for this client tree.

## Safety Label Tests
- URL helper test asserts no finance/cost/budget/customer/stakeholder/media/note/AI params.

## Regression
- Project subnav tests remain separate.
- Full test suite validates broad regression.

## Test File
- `apps/web/components/projects/reports-export-ui.test.ts`
