# Dashboard Nav Go / No-Go — 2026-06-20

## Decision
- Safe to implement next: YES.
- Selected slice: project-scoped subnavigation inside project detail.

## Why
- Many project subfeatures already exist but are buried or indirect.
- Project-scoped subnav improves reachability without broad top-level nav churn.
- It avoids customer/stakeholder finance exposure.
- It avoids AI/admin/Flywheel blocked areas.
- It does not require backend, migrations, mobile, or middleware work.

## Risks
- Accidentally linking internal costs/budget to unsafe roles.
- Adding labels without full locale parity.
- Confusing duplicate route families under `/dashboard/projects` and `/projects`.

## Blockers
- Implementation must inspect the project detail page/client structure before editing.
- Role visibility must be tested.

## Must Not Include
- Costs/Budget links.
- Reports export UI.
- AI admin/Flywheel links.
- Owner/customer/stakeholder finance links.
- Liquid Glass redesign.
- Mobile changes.
- Backend changes.
