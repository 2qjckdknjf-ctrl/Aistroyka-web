# Wave 4 Step 5 — Client / customer visibility — Summary

## What shipped

- **Schema**: `projects.client_portal_enabled`, `projects.client_show_budget_summary`; `client_visible` on `project_milestones` and `project_documents`.
- **Domain**: `client-portal` types, policy, `getClientProjectView`, `updateClientPortalSettings`.
- **API**: `GET /api/v1/projects/:id/client-view`, `PATCH /api/v1/projects/:id/client-portal`; project GET exposes `can_manage_client_portal`.
- **UI**: Manager card + schedule/documents visibility controls + `/dashboard/projects/[id]/client` for project owners.

## Product meaning

Stakeholders represented by **project owner** membership get a **curated, read-only** view of progress, milestones, documents, optional budget totals, and pending document decisions — only after managers enable the portal and mark entities visible.

## Out of scope (this wave)

Public portal, guest links, CRM, billing, chat, broad dashboard redesign.

## Docs index

1. `WAVE4_STEP5_CLIENT_SCOPE_INVENTORY.md`
2. `WAVE4_STEP5_CLIENT_VISIBILITY_MODEL.md`
3. `WAVE4_STEP5_CLIENT_BACKEND_REPORT.md`
4. `WAVE4_STEP5_CLIENT_ACTIONS_REPORT.md`
5. `WAVE4_STEP5_CLIENT_MANAGER_CONTROLS_REPORT.md`
6. `WAVE4_STEP5_CLIENT_UI_REPORT.md`
7. `WAVE4_STEP5_CLIENT_INTEGRATION_REPORT.md`
8. `WAVE4_STEP5_CLIENT_VALIDATION_REPORT.md`
9. `WAVE4_STEP5_CLIENT_POST_AUDIT.md`
10. `WAVE4_STEP5_CLIENT_SUMMARY.md` (this file)
