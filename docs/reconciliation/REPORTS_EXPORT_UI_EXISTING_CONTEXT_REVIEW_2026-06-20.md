# Reports Export UI Existing Context Review — 2026-06-20

## Project Reports UI File
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- Project Reports panel is local to this client.

## Owner/Admin Role Context
- Owner/admin role context is not directly present in the client component.
- Safe server-side context is available in the project detail page:
  - `createClient`
  - `getSessionUser`
  - `getActiveTenantRoleForUser`
- The implementation resolves role server-side and passes a boolean `canExportReports` prop.

## Role Context Safety
- Role lookup is fail-closed: errors or missing user/role return `false`.
- UI visibility uses the same owner/admin role concept as the backend export route.
- Backend route still enforces access, so UI is not trusted for authorization.

## Access Broadening
- No access broadening.
- Button is project-scoped and only renders when `canExportReports` is true.

## Files Changed
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/page.tsx`
- `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/DashboardProjectDetailClient.tsx`
- `apps/web/components/projects/reports-export-ui.ts`
- `apps/web/components/projects/reports-export-ui.test.ts`
- `apps/web/messages/{en,ru,es,it}.json`

## Fallback
- Fallback was not needed because safe server-derived owner/admin role context could be passed with a small prop.
