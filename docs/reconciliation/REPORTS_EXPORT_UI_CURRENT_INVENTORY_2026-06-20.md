# Reports Export UI Current Inventory — 2026-06-20

## Top-Level Reports Page
- Route: `/dashboard/reports`
- Page: `apps/web/app/[locale]/(dashboard)/dashboard/reports/page.tsx`
- Client: `apps/web/app/[locale]/(dashboard)/dashboard/daily-reports/DashboardReportsClient.tsx`
- Current export UI: YES, but client-side only.
- Current behavior: exports currently loaded in-memory report table with `exportTableToCsv`.
- Current filters: project, worker, date range, status, search, saved views.
- Backend export route usage: NO.

## Project Reports Tab
- Route: `/dashboard/projects/[id]?tab=reports`
- Client: `DashboardProjectDetailClient.tsx` / `ProjectReportsPanel`
- Current export UI: NO.
- Current behavior: project-scoped report list fetches `/api/v1/projects/[id]/reports`.
- Backend export route usage: NO.

## Existing Role Context
- Top-level reports client currently has no explicit owner/admin UI role context.
- Project detail client also does not currently receive owner/admin role metadata.
- Dashboard shell receives `isAdmin`, but that value is not passed to report list clients.

## Likely Files To Change Later
- For selected project-scoped UI:
  - `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
  - possible small helper under `apps/web/lib/domain/reports/` or `apps/web/components/projects/`
  - messages en/ru/es/it
  - focused tests
- For top-level UI, would require role context plumbing into `DashboardReportsClient`, so it is not the first slice.

## Current Tests
- `ProjectSubnav.test.ts` covers safe project navigation.
- Backend export route tests cover owner/admin access.
- No UI test for server-backed report export button exists yet.
