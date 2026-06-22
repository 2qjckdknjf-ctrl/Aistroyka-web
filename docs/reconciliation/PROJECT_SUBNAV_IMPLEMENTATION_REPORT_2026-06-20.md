# Project Subnav Implementation Report — 2026-06-20

## Files Changed
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- `apps/web/components/projects/ProjectSubnav.tsx`
- `apps/web/components/projects/project-subnav.items.ts`
- `apps/web/components/projects/ProjectSubnav.test.ts`
- `apps/web/messages/en.json`
- `apps/web/messages/ru.json`
- `apps/web/messages/es.json`
- `apps/web/messages/it.json`

## Component Added
- `ProjectSubnav`
- Pure helper: `getProjectSubnavItems`

## Nav Items Added
- Overview
- Reports
- Documents
- Timeline
- Approvals

## Routes Linked
- `/dashboard/projects/[id]`
- `/dashboard/projects/[id]?tab=reports`
- `/dashboard/projects/[id]?tab=documents`
- `/dashboard/projects/[id]?tab=schedule`
- `/dashboard/projects/[id]?tab=decisions`

## Role Gating
- Uses existing project detail access.
- Does not add new permissions.
- Does not expose customer/stakeholder portal routes.

## Forbidden Links Checked
- Costs/budget/internal finance: absent.
- AI admin/Flywheel/Expert Review: absent.
- Reports export UI: absent.
- Customer/stakeholder finance: absent.
- Mobile: absent.

## Tests Added
- `apps/web/components/projects/ProjectSubnav.test.ts`

## i18n Added
- `dashboardDetail.projectSubnavAria`
- `dashboardDetail.overview`
- en/ru/es/it updated.

## Validation Results
See `PROJECT_SUBNAV_VALIDATION_2026-06-20.md`.

## Out Of Scope
- Liquid Glass redesign.
- Public site redesign.
- Reports export UI.
- Costs/budget links.
- Customer/stakeholder finance.
- AI admin/Flywheel.
- Mobile.
- Backend/API.
- Migrations.
- Middleware.
