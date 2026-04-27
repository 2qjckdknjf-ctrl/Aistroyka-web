# Wave 4 Step 6 — Client decisions / requests — Summary

## Delivered

- **Tables**: `project_client_requests`, `project_client_request_events`.
- **Domain**: policy, repository, service with explicit kinds and lifecycle.
- **APIs**: collection + item + respond; manager-first list on GET when permitted.
- **UI**: `ClientRequestsManagerPanel` (managers), `ClientPortalRequestsSection` (stakeholders).
- **Integration**: `ClientProjectView.client_requests` populated from DB.

## Product meaning

Managers create **finite, auditable** asks; project owners respond through **typed actions** — not a messaging or ticketing product.

## Doc index

1. `WAVE4_STEP6_CLIENT_REQUESTS_INVENTORY.md`
2. `WAVE4_STEP6_CLIENT_REQUESTS_BACKEND_REPORT.md`
3. `WAVE4_STEP6_CLIENT_REQUESTS_GOVERNANCE_REPORT.md`
4. `WAVE4_STEP6_CLIENT_REQUESTS_MANAGER_UI_REPORT.md`
5. `WAVE4_STEP6_CLIENT_REQUESTS_CLIENT_UI_REPORT.md`
6. `WAVE4_STEP6_CLIENT_REQUESTS_INTEGRATION_REPORT.md`
7. `WAVE4_STEP6_CLIENT_REQUESTS_VALIDATION_REPORT.md`
8. `WAVE4_STEP6_CLIENT_REQUESTS_POST_AUDIT.md`
9. `WAVE4_STEP6_CLIENT_REQUESTS_SUMMARY.md` (this file)
