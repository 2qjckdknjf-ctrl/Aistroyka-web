# Frontend Flags / Auth Visibility Audit — 2026-06-20

## Hidden By Role / Auth
- Dashboard routes require authenticated tenant context.
- Admin routes require owner/admin membership; admin dashboard nav only exposes Push and Jobs.
- Stakeholder routes are portal-only and blocked from internal dashboard paths by stakeholder path guards.
- Owner/customer/client portal routes depend on project membership and portal enablement/data.
- Report review UI depends on manager/admin/member review permission and submitted report state.

## Hidden By Flags / Env
- AI/Copilot UI exists, but runtime behavior depends on AI provider/env/fallback configuration.
- Admin AI observability calls Edge function `aistroyka-admin-ai`; visibility/usefulness depends on env and admin role.
- AI Flywheel, Gold Memory, and Expert Review Queue admin surfaces are not in current branch; they exist in external AI/design branches and remain blocked by migrations/RLS.

## Hidden By Data Absence
- Projects/reports/documents/approvals pages can render empty states if no tenant/project data.
- Owner/customer/stakeholder portal surfaces require assigned projects and memberships.
- Notifications/support/stakeholder activity require existing records.

## Exists But Not Obviously Reachable
- Many admin pages under `/admin/*` beyond Push/Jobs.
- Project subfeatures like documents, costs, milestones, defects, handover, discussions, owner/client views.
- Reports export backend route has no UI.

## Backend Not Ready Dependencies
- AI Expert Review Queue, Gold Memory, Training Consent UI from external branches depends on AI migrations/routes and is not ready.
- Customer/stakeholder finance exports remain disallowed.

## Verdict
- Main visibility issue is not lack of routes; it is navigation/reachability plus missing integration of design/public/dashboard branch deltas.
