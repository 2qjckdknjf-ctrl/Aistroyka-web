# Step 10 — Dashboard Action Summary (Operations Queue)

## Status after Step 10

**FULL** for stated scope: clearer role, ordering, empty state, CTAs.

## Changes

1. **Renamed** card to **Operations queue** with subline: tasks, reports, uploads, AI jobs — explicitly **not** project intelligence.
2. **Ordering** (`buildPriorityItems`): overdue tasks first; **failed AI jobs (24h)** always as high priority when count &gt; 0; stuck uploads; then reports, workers, due-today. Cap 7.
3. **Copy**: reasons tightened (“Task past due date”, “Review failures and retry…”).
4. **Empty state**: States this is **not** a health score; points to per-project Intelligence.
5. **CTA**: **Act →** (aligned with ManagerActionView).

## Remaining gaps

- Does not show cross-project intelligence (by design — that lives per project).  
- `hasOpsData` helper available for future “loading vs empty” UX if API ever returns ambiguous payloads.
