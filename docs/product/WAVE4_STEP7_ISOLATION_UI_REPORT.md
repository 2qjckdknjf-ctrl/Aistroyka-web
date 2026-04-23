# Wave 4 Step 7 — Isolation UI / route report

**Date:** 2026-03-29

## C1 — Route restrictions (middleware)

**File:** `apps/web/middleware.ts`  
**Helper:** `lib/tenant/stakeholder-dashboard-paths.ts` + `getActiveTenantRoleForUser` (`lib/tenant/tenant-role.server.ts`)

When `tenant_members`-resolved role is **`stakeholder`**:

- `/dashboard` → `/dashboard/projects`
- `/dashboard/projects/[id]` → `/dashboard/projects/[id]/client`
- Any other `/dashboard/*` not allowlisted → `/dashboard/projects`
- `/projects/*`, `/billing`, `/admin`, `/portfolio` → `/dashboard/projects`

**Allowlist:** `/dashboard/projects`, `/dashboard/stakeholder-invite`, `/dashboard/projects/[id]/client/...`

## C2 — Shell minimization

**File:** `apps/web/components/DashboardShell.tsx`  
**Layout:** `apps/web/app/[locale]/(dashboard)/layout.tsx` passes `portalOnlyStakeholder={tenantRole === "stakeholder"}`.

When true:

- Sidebar links: **Projects** only (internal nav hidden).
- Logo home: `/dashboard/projects`.
- Top bar: “Client portal” label; workspace date/search, notifications, plan badge hidden (reduces accidental navigation to internal affordances).

## C3 — Manager / internal UX

Unchanged for non-stakeholder roles.

## C4 — Limitations

- Direct URL entry to **legacy** routes under `/api/...` must remain blocked server-side (done for routes migrated to `getProjectForInternalWorkspace`).  
- **Client portal** “Back to project overview” still links to `/dashboard/projects/[id]`; middleware redirects stakeholders to **`/client`**, avoiding the internal hub.
