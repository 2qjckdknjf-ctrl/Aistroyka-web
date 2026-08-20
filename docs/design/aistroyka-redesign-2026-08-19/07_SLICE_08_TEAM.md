# Slice 08 — Team & Contractors (Surface H)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

- Workers directory, worker detail, worker days, contractors directory, contractor detail, and Team page chrome on `DashboardGlassCard`.
- Routes, RBAC, and CSV/export actions unchanged.

## Out of scope

- Presence / availability live map.
- Merging Manager and Worker apps.

## Validation

```bash
bun run --cwd apps/web check:design
bun run --cwd apps/web lint
```
