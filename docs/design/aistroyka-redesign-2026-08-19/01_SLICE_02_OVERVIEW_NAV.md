# AISTROYKA Redesign — Slice 02 Overview & Nav IA

**Date:** 2026-08-19  
**Builds on:** `00_SLICE_01_FOUNDATION.md`  
**Canonical surface:** A — Dashboard / Portfolio Overview (partial)

## In scope

- Sidebar IA grouped into **Command / Operations / Intelligence / Settings** (routes unchanged).
- **Portfolio** linked in Command group (`/portfolio`).
- **Needs attention first:** `DashboardManagerActionsClient` moved above KPI/queue grid.
- KPI + queue panels migrated from opaque `Card` to **`DashboardGlassCard`** (Liquid Glass).
- **`DashboardGlassCard`** shared primitive for dashboard metrics.
- Canonical render **docs** imported from `design/aistroyka-canonical-render-pack-2026-08-16` (no PNG binaries).
- Nav group labels in EN/RU/ES/IT.

## Out of scope

- Project Command Center tab unification (Slice 03+).
- Mobile bottom nav (4–5 destinations).
- Projects list visual refresh (surface B).
- PNG render assets verification/import.

## Validation

- `bun run --cwd apps/web check:design`
- `bun run i18n:check` (nav scope)
- Vitest: `dashboard-nav.utils.test.ts`, `liquid-glass-roots.test.ts`, `DashboardShell.test.ts`
