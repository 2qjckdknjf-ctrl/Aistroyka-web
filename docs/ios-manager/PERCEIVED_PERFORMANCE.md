# Perceived Performance (Phase 5)

**Date:** 2026-03-07  
**Scope:** Perceived speed without speculative features.

---

## Current behavior

- **Loading:** Full-screen LoadingStateView or inline ProgressView during fetches; refreshable on list/detail screens.
- **Data flow:** Single load on appear; refresh after mutation (assign, report review). No prefetch of adjacent screens.

## Recommendations (optional future)

- **Skeleton states:** Replace "Loading…" with grey placeholder rows (e.g. 3–5 rectangles) for lists (tasks, reports, notifications) to reduce perceived wait. Detail screens can keep spinner or add skeleton blocks.
- **Optimistic UI:** Task assign could show assigned_to immediately and revert on error; currently we refresh after success to avoid desync. Report review already refreshes and shows new status.
- **Prefetch:** When opening project detail, prefetch of project-scoped tasks/reports is possible but adds complexity; not implemented.
- **Blocking spinners:** Used only where necessary (initial load, submit); lists use refreshable instead of blocking. No change required for Phase 5.
