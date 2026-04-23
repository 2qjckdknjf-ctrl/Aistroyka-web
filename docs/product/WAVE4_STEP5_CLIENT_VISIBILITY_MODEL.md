# Wave 4 Step 5 — Visibility model & exposure rules (Stage B)

## B1 — Model chosen

**Explicit flags + curated projection** (no reuse of raw manager JSON):

1. **Project-level**
   - `client_portal_enabled` — master switch; when false, no client read model.
   - `client_show_budget_summary` — optional aggregate budget card.

2. **Entity-level**
   - `project_milestones.client_visible`
   - `project_documents.client_visible`

3. **Assembler** — `getClientProjectView` in `lib/domain/client-portal/client-portal.service.ts` builds `ClientProjectView` DTOs only from allowed fields and filtered rows.

## B2 — Manager-controlled exposure

| Surface | Control |
|---------|---------|
| Entire portal | `ClientPortalManagerCard` → `PATCH /api/v1/projects/:id/client-portal` (`client_portal_enabled`) |
| Budget summary | Same route + `client_show_budget_summary` |
| Milestones | Schedule panel: checkbox “Show to client portal” → `client_visible` on milestone PATCH |
| Documents | Documents panel: Client column + visibility → `client_visible` on document PATCH |

Policy: `canManageClientPortalSettings` — tenant owner/admin **or** tenant `member` with `project_members.role = manager` for that project.

## B3 — Internal vs external boundary

| Layer | Who | Data |
|-------|-----|------|
| Internal | Managers, workers, other members | Full APIs, repositories, manager UI |
| Stakeholder “client” view | Project **owner** membership only | `GET /api/v1/projects/:id/client-view` + `/dashboard/projects/[id]/client` |

Non-owners receive 403 from the read model even if portal is enabled.

## Leakage controls (explicit)

- **No file paths** in `ClientProjectView`.
- **Decisions** only from documents that are both `client_visible` and in a pending state.
- **Budget** only when `client_show_budget_summary` is true.

Migration: `apps/web/supabase/migrations/20260329100000_project_client_portal.sql`.
