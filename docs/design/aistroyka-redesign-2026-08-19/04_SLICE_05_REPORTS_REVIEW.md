# Slice 05 — Reports & Review (Surface E)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface E — Reports & Review (field evidence → manager decision)

## In scope

- **`DashboardReportsClient`** — Liquid Glass list table; review queue strip when `submitted` reports exist (count + filter to pending approval).
- **Report detail** — glass panels on `/dashboard/daily-reports/[id]` and `/dashboard/reports/[id]` (metadata, media, AI analysis, approval flow unchanged).
- **`reports-list.utils.ts`** — shared pending-count + status badge variant helpers + unit tests.

## Out of scope

- Split review layout (evidence left / decision right) — see Slice 16.
- AI observation panel redesign beyond existing analysis-status block.
- New routes; both `/dashboard/reports` and `/dashboard/daily-reports` keep existing paths.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web test -- reports-list
bun run --cwd apps/web lint
```
