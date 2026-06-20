# Reports Export UI Placement Options — 2026-06-20

## Option A — Top-Level Reports Page Export Button, Tenant Owner/Admin Only
- User value: high for tenant-wide admins.
- Security risk: medium; tenant-wide export must stay owner/admin only.
- Role complexity: high in current UI because `DashboardReportsClient` does not receive role/admin context.
- Files likely changed: reports page/server wrapper, `DashboardReportsClient`, messages, tests.
- Tests needed: owner/admin visible, worker/stakeholder hidden, URL safe params.
- Verdict: not first.

## Option B — Project Reports Tab Export Button With `project_id`, Tenant Owner/Admin Initially
- User value: high and project-scoped.
- Security risk: lower; `project_id` scopes the backend route and avoids tenant-wide export UI.
- Role complexity: medium; still needs owner/admin visibility decision, but placement is safer.
- Files likely changed: project detail client/reports panel, messages, tests.
- Tests needed: button URL includes `project_id`; forbidden labels/params absent; role gating if role context available.
- Verdict: selected.

## Option C — Project Reports Tab Export Button For Project Managers Too
- User value: medium/high.
- Security risk: medium; backend route currently allows only owner/admin for export.
- Role complexity: high; would require backend policy expansion or separate route behavior.
- Verdict: do not choose now.

## Option D — No UI Yet; Add Frontend Tests/Helpers For Export URL Generation
- User value: low but safe.
- Security risk: low.
- Role complexity: low.
- Verdict: useful as part of Option B, but not enough alone.

## Selected Option
- Option B, with a helper/test-first approach and no backend policy change.
