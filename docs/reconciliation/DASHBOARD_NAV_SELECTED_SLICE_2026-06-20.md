# Dashboard Nav Selected Slice — 2026-06-20

## Selected Slice
Option B: Add project-scoped subnavigation inside project detail.

## Exact Nav Items
Inside project detail only:
- Overview
- Reports
- Documents
- Timeline / Milestones
- Approvals / Decisions

Do not add:
- Costs/Budget
- Customer finance
- Stakeholder finance
- AI admin/Flywheel
- Reports export
- Owner/customer portal links

## Exact Routes
- `/dashboard/projects/[id]`
- `/dashboard/projects/[id]/reports` or existing equivalent project reports surface if present
- project documents surface/section
- project timeline/milestones surface/section
- project decisions/approvals surface/section

Route confirmation must happen during implementation because current project detail has both page sections and subroutes.

## Exact Role Visibility
- Tenant owner/admin: see project subnav safe items.
- Manager/member with project access: see project subnav safe items.
- Worker: only if current project access allows read; no review/export controls.
- Owner/customer/stakeholder: do not use internal dashboard subnav; their portals stay separate.
- Anonymous: hidden.

## Exact Files Likely Changed Later
- Project detail page/client under `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/`
- New or existing project subnav component under `apps/web/components/projects/`
- Locale messages in `apps/web/messages/{en,ru,es,it}.json`
- Tests for project subnav/nav reachability

## Exact Tests
- Project detail renders subnav for allowed internal role.
- Subnav contains Reports, Documents, Timeline/Milestones, Approvals/Decisions.
- Subnav does not contain Costs/Budget, internal finance, AI admin, Reports export, owner/customer finance.
- Worker/stakeholder/customer role tests where available.
- i18n keys exist in en/ru/es/it if labels added.

## Forbidden Links
- `/dashboard/projects/[id]/costs`
- any internal budget/cost/margin/profitability route
- AI Expert Review/Flywheel/Admin AI
- reports export
- owner/customer/stakeholder finance export
- mobile-specific routes

## Validation Commands
- `bun run lint`
- `bun run i18n:check`
- focused tests
- `bun run test -- --run`
- `bun run build`
- `bun run cf:build`
