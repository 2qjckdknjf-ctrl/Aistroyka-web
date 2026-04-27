# Wave 4 Step 13 — Stakeholder / client UI report

## Surfaces

1. **Client portal home** — Card “Punch list” linking to `.../client/defects`.  
2. **`/dashboard/projects/[id]/client/defects`** — `ClientPortalDefectsListClient`: list + “Report an item” (title, description, blocking).  
3. **`/dashboard/projects/[id]/client/defects/[defectId]`** — `ClientPortalDefectDetailClient`: title, description, status, blocking badge, optional due date (if set by team), generic assignee line, resolution summary.

## Visibility rules

- No internal-only assignment identifiers (UUID).  
- Status and blocking state visible for transparency.  
- Create limited to stakeholder-safe payload (matches RLS).

## Limitations

- No threaded comments on defects in this step.  
- No edit of team-managed fields by stakeholder (same as other governed objects).
