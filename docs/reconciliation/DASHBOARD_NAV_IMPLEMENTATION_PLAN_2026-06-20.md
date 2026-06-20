# Dashboard Nav Implementation Plan — 2026-06-20

## Selected Slice
Project-scoped subnavigation inside project detail.

## Files To Modify Later
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/page.tsx`
- the corresponding project detail client component if present
- new or existing `apps/web/components/projects/*Subnav*.tsx`
- `apps/web/messages/en.json`
- `apps/web/messages/ru.json`
- `apps/web/messages/es.json`
- `apps/web/messages/it.json`
- focused tests for project navigation

## Labels / Locales
Likely labels:
- Overview
- Reports
- Documents
- Timeline
- Approvals

Final key names should follow existing message namespace conventions.

## Role Gate Logic
- Use existing project access and dashboard auth.
- Do not introduce new auth policy.
- Do not expose internal finance links.
- Do not expose customer/stakeholder portal links in internal dashboard subnav.

## Tests To Add Later
- Project subnav visible on project detail for internal allowed role.
- Safe items present.
- Forbidden items absent.
- Existing dashboard nav still includes current top-level items.
- i18n key parity.

## Validation Commands
- `bun run lint`
- `bun run i18n:check`
- focused tests
- `bun run test -- --run`
- `bun run build`
- `bun run cf:build`

## Rollback Plan
- Revert single nav slice commit.
- No DB/migration rollback.
- No backend rollback.

## Out Of Scope
- Liquid Glass redesign.
- Public site redesign.
- Reports export UI.
- Costs/budget links.
- Customer/stakeholder finance.
- AI admin/Flywheel.
- Mobile.
- Middleware/auth changes.
