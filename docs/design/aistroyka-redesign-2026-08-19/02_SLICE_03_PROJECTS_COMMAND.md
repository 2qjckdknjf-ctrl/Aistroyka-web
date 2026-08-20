# Slice 03 — Projects & Project Command Center

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Memory OS record `56263de1-d0a9-48b6-8275-e40df7391f5a` — Surface B (Projects) + unified Project Command Center nav (PD-P1-04)

## Goals

1. Remove competing dual navigation on project detail (subnav + tabs).
2. Apply Liquid Glass panels to Projects list and project KPI strip.
3. Add phone bottom nav (5 primary destinations) in dashboard shell.

## Changes

### Unified Project Command Center tabs

- `project-detail-tabs.ts` — canonical tab order, default tab `overview`.
- `DashboardProjectDetailClient.tsx` — removed `ProjectSubnav`; single `Tabs` row driven by `PROJECT_COMMAND_TAB_ORDER`; URL sync via `?tab=`; overview quick-links panel.
- `project-subnav.items.ts` — overview active state aligned to `overview` tab (component retained for safe-nav tests).

### Glass surfaces

- `DashboardProjectsListClient.tsx` — list/table on `DashboardGlassCard`.
- Project detail summary KPIs + tab container on `DashboardGlassCard`.

### Mobile IA

- `DashboardMobileNav.tsx` — fixed bottom nav (Overview, Projects, Tasks, Reports, Help) on `md:hidden`.
- `DashboardShell.tsx` — renders mobile nav + main padding for safe area.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web test -- project-detail-tabs project-subnav DashboardMobileNav dashboard-nav liquid-glass-roots
```

## Out of scope (later slices)

- Client portal shell (PD-P1-05)
- Full Surface C–J rollout
- Render PNG import from canonical render pack
