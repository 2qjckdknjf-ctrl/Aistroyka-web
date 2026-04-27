# Wave 4 Step 19 — Integration (Stage E)

## E1 — Product flow integration

| Domain | Integration |
|--------|-------------|
| Change orders | Rows from `project_change_order_events` + parent links |
| Handover | `project_handover_events` |
| Defects | `project_defect_events` + parent links |
| Aftercare | `project_service_request_events` + parent links |
| Discussions | `project_stakeholder_discussion_entries` + discussion title |
| Documents | `project_document_events` scoped via project documents |
| Report approvals | `report_approval_events` scoped via project-linked reports |

## E2 — Drilldowns

- **targetUrl** on each item points to existing manager surfaces (project tabs, daily reports).
- No new generic “audit explorer” route.

## E3 — Intentionally not touched

- Android / iOS apps.
- Portfolio-wide trace (single-project scope only).
- Executive review pack PDFs (no change in Step 19).
- `audit_logs` owner/admin table (still separate product concern).
- Client portal–specific layouts (internal workspace API).
