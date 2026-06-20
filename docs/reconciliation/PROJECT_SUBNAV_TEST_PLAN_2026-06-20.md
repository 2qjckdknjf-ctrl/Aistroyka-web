# Project Subnav Test Plan — 2026-06-20

## Visibility
- Project subnav item builder includes Overview.
- Project subnav item builder includes Reports.
- Project subnav item builder includes Documents.
- Project subnav item builder includes Timeline/Schedule.
- Project subnav item builder includes Approvals/Decisions.

## Forbidden Links
- No Costs/Budget/Internal Finance link.
- No AI admin/Flywheel/Expert Review link.
- No Reports Export UI link.
- No customer/stakeholder finance link.
- No mobile link.

## Role Safety
- Subnav is rendered only inside existing project detail route.
- It does not expand route access by itself.
- It does not include manager/admin-only export controls.
- It does not include portal/customer/stakeholder routes.

## i18n
- Added `dashboardDetail.projectSubnavAria`.
- Added `dashboardDetail.overview`.
- Updated en/ru/es/it.

## Tests Added
- `apps/web/components/projects/ProjectSubnav.test.ts`
