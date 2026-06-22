# Dashboard Nav Current Structure — 2026-06-20

## Nav Component Files
- `apps/web/components/DashboardShell.tsx`
- `apps/web/components/dashboard-nav.utils.ts`
- `apps/web/components/DashboardShell.test.ts`
- `apps/web/app/[locale]/(dashboard)/layout.tsx`
- `apps/web/messages/{en,ru,es,it}.json`

## Current Top-Level Sidebar Items
- `/dashboard`
- `/dashboard/projects`
- `/dashboard/tasks`
- `/dashboard/workers`
- `/dashboard/contractors`
- `/dashboard/reports`
- `/dashboard/approvals`
- `/dashboard/uploads`
- `/dashboard/devices`
- `/dashboard/ai`
- `/dashboard/alerts`
- `/dashboard/support`
- `/dashboard/settings/auth`
- `/dashboard/help`

## Current Role-Gated Items
- `/team` appears when `canManageTeam` is true.
- Admin group appears when `isAdmin` is true.
- Admin group currently links only:
  - `/admin/push`
  - `/admin/jobs`

## Routes Existing But Not Linked Directly In Sidebar
- `/dashboard/workload`
- `/dashboard/notifications`
- `/dashboard/daily-reports`
- `/dashboard/governance`
- `/portfolio`
- many `/admin/*` routes: AI, billing pilot, governance, leads, operator, system, trust
- project subfeature routes:
  - project documents
  - project reports
  - project owner/client views
  - defects
  - discussions
  - handover
  - milestones/timeline
  - service requests
  - change orders
- `/portal` and `/portal/projects`
- `/owner`

## Locale Labels
- Current nav labels exist for the visible sidebar entries.
- Any new nav labels later require updates in en/ru/es/it and `i18n:check`.

## Test Coverage
- `DashboardShell.test.ts` currently covers only admin nav include/exclude utility.
- E2E dashboard navigation specs reference selected sidebar links and test IDs.

## Structure Verdict
- Current nav is stable but flat and incomplete.
- The lowest-risk next frontend slice is not a redesign; it is role-safe reachability for already-routed dashboard surfaces.
