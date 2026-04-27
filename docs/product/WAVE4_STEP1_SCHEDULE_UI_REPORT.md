# Wave 4 Step 1 — Manager UI (Stage D)

## Surfaces

### Project detail — Schedule tab

**File:** `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/ProjectSchedulePanel.tsx`

- Lists milestones sorted by `target_date`.
- **Cards show:** title, status badge (mapped labels for new enum), target date, **task progress** (x/y, %, thin bar).
- **Schedule signals** rendered as bullet list (`code` + `reason`).
- **Actions:** “View tasks” (project filter), “Link task” (`milestone_id` query on tasks page), **Update status** inline (PATCH milestone).
- **Create:** title + date form when milestones exist or from empty state.

### Project overview — Milestones summary card

**File:** `DashboardProjectDetailClient.tsx`

- Total milestone count unchanged.
- If **`overdueMilestonesCount > 0`:** red line with count + link to `?tab=schedule`.
- If milestones exist and none overdue: neutral subtitle “No overdue by target date”.

## Patterns reused

- `@tanstack/react-query` for fetch + invalidation.
- Existing `Button`, `Skeleton`, `EmptyState`, `Card` (schedule panel avoids extra Card wrapper where list is primary).

## Limitations

- No drag-and-drop reorder (sort order not exposed in UI this step).
- No inline milestone description editor (API supports it; UI focuses on title/date/status).
- English labels in schedule panel for status strings (i18n follow-up if required).
