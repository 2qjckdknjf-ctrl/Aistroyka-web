# Dashboard Nav Test Plan — 2026-06-20

## Visibility Tests
- Project detail renders project subnav for an allowed internal role.
- Subnav includes Reports.
- Subnav includes Documents.
- Subnav includes Timeline/Milestones.
- Subnav includes Approvals/Decisions.

## Role-Gating Tests
- Anonymous cannot see dashboard nav.
- Worker does not see manager/admin controls.
- Stakeholder/customer roles do not see internal dashboard subnav.
- Admin-only nav remains admin-only.

## Finance Safety Tests
- No Costs/Budget top-level link added.
- Project subnav does not expose internal finance by default.
- No labels or hrefs include internal cost/margin/profitability/budget-pressure surfaces.

## AI/Admin Safety Tests
- No AI Expert Review/Flywheel links added.
- Existing AI/Copilot nav remains unchanged.
- Admin AI routes remain hidden from this slice.

## Reports Export Safety
- Reports export UI is not part of this slice.
- If a reports page later adds export UI, it must be separately owner/admin-gated.

## i18n Tests
- Any new label keys added to en/ru/es/it.
- Run `bun run i18n:check`.

## Regression Tests
- Existing `DashboardShell.test.ts` remains passing.
- Existing dashboard navigation E2E expectations should not break.
- Existing project detail route renders.
