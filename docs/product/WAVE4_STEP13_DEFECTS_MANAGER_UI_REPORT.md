# Wave 4 Step 13 — Manager UI report

## Surfaces

1. **Project overview — “Punch list” tab** (`DashboardProjectDetailClient`)  
   - Renders `DefectsProjectTab`: list, inline create, links to manager detail.  
   - Deep link from handover blocker: `?tab=defects`.

2. **Manager defect detail**  
   - `.../dashboard/projects/[id]/defects/[defectId]` — `ManagerDefectDetailClient`: edit fields, transitions, history (events).

## Controls

- Create item (title, description, blocking).  
- Open full detail for assignment, due date, links, status transitions, resolve/close.  
- Copy explains distinction from generic issues / bug tracker where relevant.

## Limitations

- No bulk import/export.  
- No Gantt or board view.  
- Dashboard shell otherwise unchanged.
