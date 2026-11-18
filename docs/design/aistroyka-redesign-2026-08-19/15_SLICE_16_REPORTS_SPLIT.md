# Slice 16 — Reports split review layout

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)  
**Canonical ref:** Surface E — evidence left / manager decision right

## In scope

- Shared `ReportReviewSplit` chrome for report detail pages.
- `/dashboard/daily-reports/[id]` and `/dashboard/reports/[id]`: evidence (context, media, AI) + sticky decision column (approval / history / notes).
- Submitted reports highlight the decision column; non-submitted show a waiting state (no fake approval UI).
- Helpers: `analysisStatusBadgeVariant`, `shouldPrioritizeReportDecision`.

## Out of scope

- Drag-and-drop evidence annotation.
- Changing approve/reject API or audit history semantics.
- Gantt / drawing inspector (absent).

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web test -- reports-list
bun run --cwd apps/web lint
```
