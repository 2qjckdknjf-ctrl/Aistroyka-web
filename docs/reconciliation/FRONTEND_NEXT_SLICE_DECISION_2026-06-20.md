# Frontend Next Slice Decision — 2026-06-20

## Option A — Add UI Entry For Existing Reports Export Backend
- Value: makes new backend route visible.
- Risk: small; owner/admin-only UI must be role-gated.
- Backend dependency: already implemented.
- External branch source: none required.
- Tests needed: route/UI unit or Playwright dashboard reports check.
- Validation: lint, i18n if copy changes, tests, build, cf:build.
- Recommendation: useful but not first; does not address broader "site does not visibly change" complaint.

## Option B — Restore/Reconcile Dashboard Navigation Reachability
- Value: high; many existing routes are hidden or indirect.
- Risk: moderate; nav changes can affect auth/role visibility.
- Backend dependency: mostly current.
- External branch source: `release/web-pilot-rc` for DashboardShell/Nav references.
- Tests needed: dashboard nav test updates, role-gated nav assertions, no customer finance links.
- Validation: lint, i18n, tests, build, cf:build; browser audit later.
- Recommendation: recommended.

## Option C — Restore Public Site / Brand Baseline
- Value: high for public visibility.
- Risk: moderate; many files/messages and design changes.
- Backend dependency: low.
- External branch source: `release/web-pilot-rc` primary, `design/liquid-glass-public-shell-lg2a` reference.
- Tests needed: i18n, route smoke, public nav/header checks.
- Validation: lint, i18n, tests, build, cf:build.
- Recommendation: second candidate if public site is prioritized over dashboard.

## Option D — Owner/Customer/Stakeholder Portal Visibility Audit/Wiring
- Value: high for product completeness.
- Risk: P0 around finance/customer isolation.
- Backend dependency: portal/client/stakeholder APIs.
- External branch source: `release/web-pilot-rc`.
- Tests needed: customer finance isolation, role/project membership.
- Recommendation: defer until nav/public baseline audit.

## Option E — AI/Admin Surfaces
- Value: high for AI roadmap.
- Risk: P0; migrations/RLS/runtime not ready.
- Backend dependency: blocked AI migrations/routes.
- Recommendation: do not choose.

## Chosen Next Slice
- Option B: Dashboard navigation/reachability audit and minimal nav slice planning.

## Reason
Current branch already has many dashboard/project/report/document/approval routes, but primary navigation exposes only a subset. A navigation/reachability slice is lower risk than AI/mobile/customer finance and directly addresses "features exist but are not visible."

## Likely Files Later
- `apps/web/components/DashboardShell.tsx`
- dashboard nav tests
- message bundles if labels change
- possibly project subnav components only after audit

## Not Included
- No AI admin/Flywheel.
- No customer/stakeholder finance.
- No mobile.
- No broad Liquid Glass port.
