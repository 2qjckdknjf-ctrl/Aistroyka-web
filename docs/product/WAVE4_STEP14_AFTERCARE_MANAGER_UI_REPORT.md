# Wave 4 Step 14 — Manager UI

## Surfaces

1. **Project tab — “Aftercare”** (`DashboardProjectDetailClient` → `?tab=aftercare`)  
   - Component: `ServiceRequestsProjectTab.tsx`  
   - List + create with title, description, coverage selector, initial `reported`.

2. **Detail page** — `/dashboard/projects/[id]/service-requests/[requestId]`  
   - Component: `ManagerServiceRequestDetailClient.tsx`  
   - Edit: title, description, coverage, assignee UUID, due date, optional `linked_defect_id`, `linked_discussion_id`.  
   - Transitions: dropdown + resolution note when moving to `resolved`; closure note when closing before `resolved`.  
   - **History:** full event list with actor id prefix and notes.

## Workflow

- Mirrors punch-list operational density without reusing the punch-list tab (aftercare is **post-handover**).  
- Deep link from project activity timeline (`?tab=aftercare`) for new timeline entries.

## Limitations

- Assignee is not a user picker — UUID field only (minimal scope).  
- No bulk actions or cross-project queues.
