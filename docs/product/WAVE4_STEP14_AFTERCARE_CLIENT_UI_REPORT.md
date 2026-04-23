# Wave 4 Step 14 — Stakeholder (client portal) UI

## Surfaces

1. **Client portal home** — card linking to aftercare list (`ClientPortalViewClient.tsx`).  
2. **List** — `/dashboard/projects/[id]/client/service-requests` (`ClientPortalServiceRequestsListClient.tsx`): submit title + description; table of title / status / coverage label.  
3. **Detail** — `/dashboard/projects/[id]/client/service-requests/[requestId]` (`ClientPortalServiceRequestDetailClient.tsx`): title, status, human-readable coverage, description, optional due date, optional links to related punch list item or discussion, **outcome** (`resolution_note`) when present.

## Visibility rules

- API `GET .../service-requests/:id` returns `audience: stakeholder` for portal users; service layer returns **`ServiceRequestPublicDetail`** — **no assignee**, **no event history**, **no internal transition notes**.  
- Coverage state **is** shown (trust + clarity on warranty vs not).  
- Stakeholder **POST** creates only `reported` + `warranty_review_needed` (also enforced in RLS).

## Limitations

- No commenting thread on the request in this step.  
- No push notification wiring specific to aftercare (general notifications unchanged).
