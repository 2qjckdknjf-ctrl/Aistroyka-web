# Wave 4 Step 5 — Manager control surfaces (Stage E)

## E1 — Controls added

| Control | Location | API |
|---------|----------|-----|
| Enable client portal | `ClientPortalManagerCard` on project | `PATCH .../client-portal` `{ client_portal_enabled }` |
| Show high-level budget | Same card | `PATCH .../client-portal` `{ client_show_budget_summary }` |
| Milestone visible to client | `ProjectSchedulePanel` | Milestone PATCH with `client_visible` |
| Document visible to client | `ProjectDocumentsPanel` — Client column | Document PATCH with `client_visible` |

## E2 — Who can manage

- **Portal toggles**: `canManageClientPortalSettings` — tenant owner/admin **or** project manager (`project_members.role === manager`).
- **Per-entity visibility**: Same managers editing schedule/documents (existing PATCH routes extended with `client_visible`).

## E3 — Dashboard scope

- No redesign of the main dashboard; a single card on the project detail page plus columns/checkboxes in existing panels.

## Preview

- When portal is enabled, managers see a link to **Open client view** (`/dashboard/projects/[id]/client`).
- Project **owners** see **Client portal →** navigation when portal is enabled.
