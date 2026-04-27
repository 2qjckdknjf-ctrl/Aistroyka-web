# Wave 4 Step 14 — Aftercare / warranty summary

**Outcome:** Aistroyka now has a **controlled post-handover service request layer**: persisted requests, warranty/coverage classification, manager workflow with audit history, and stakeholder-facing list/detail with safe fields.

## What shipped

- **SQL:** `project_service_requests`, `project_service_request_events` + RLS.  
- **Domain + API:** `lib/domain/aftercare/*`, REST under `/api/v1/projects/:id/service-requests`.  
- **UI:** Manager “Aftercare” tab + detail page; client portal list/detail + home card.  
- **Timeline:** Service request created/resolved events on internal project timeline.  
- **Tests:** Domain + route tests; full `apps/web` vitest green; production build green.

## Carryover (not blocking closure)

- User-friendly assignee selection (P1) — manager UX graded **PARTIAL** in post-audit until improved.  
- Optional stakeholder-activity feed entries (P2).  
- Optional stricter validation of linked defect id (P2).

## Docs index

1. `WAVE4_STEP14_AFTERCARE_INVENTORY.md`  
2. `WAVE4_STEP14_AFTERCARE_BACKEND_REPORT.md`  
3. `WAVE4_STEP14_AFTERCARE_GOVERNANCE_REPORT.md`  
4. `WAVE4_STEP14_AFTERCARE_MANAGER_UI_REPORT.md`  
5. `WAVE4_STEP14_AFTERCARE_CLIENT_UI_REPORT.md`  
6. `WAVE4_STEP14_AFTERCARE_INTEGRATION_REPORT.md`  
7. `WAVE4_STEP14_AFTERCARE_VALIDATION_REPORT.md`  
8. `WAVE4_STEP14_AFTERCARE_POST_AUDIT.md`  
9. `WAVE4_STEP14_AFTERCARE_SUMMARY.md` (this file)
