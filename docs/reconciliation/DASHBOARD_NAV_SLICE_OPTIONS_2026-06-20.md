# Dashboard Nav Slice Options — 2026-06-20

## Option A — Add Safe Top-Level Links For Stable Routes
- User value: medium; exposes hidden pages.
- Risk: medium; too many top-level links can clutter and expose unsafe routes.
- Files likely changed: `DashboardShell.tsx`, messages, tests.
- Tests needed: nav visible/hidden by role.
- Role gates needed: admin/team/export.
- Backend readiness: mixed.
- Recommendation: partial, not first as broad top-level expansion.

## Option B — Add Project-Scoped Subnavigation Inside Project Detail
- User value: high; documents, reports, schedule/timeline, approvals are buried inside project context.
- Risk: lower than broad top-level nav; project scope naturally limits exposure.
- Files likely changed: project detail page/client/subnav component, messages, tests.
- Tests needed: subnav links exist, no internal finance link for unsafe roles, routes render.
- Role gates needed: project access, internal finance hidden from customer/stakeholder.
- Backend readiness: mostly ready.
- Recommendation: recommended.

## Option C — Add Manager/Admin Reports Export Entry Point
- User value: medium; surfaces newly implemented backend route.
- Risk: low/moderate if owner/admin-gated.
- Files likely changed: reports page/client, messages, tests.
- Tests needed: export button visible only to owner/admin; hidden from worker/stakeholder.
- Backend readiness: ready.
- Recommendation: separate tiny future slice, not the nav reachability slice.

## Option D — Restore Nav Grouping From `release/web-pilot-rc`
- User value: high.
- Risk: high; broad external branch with design/API/AI contamination.
- Files likely changed: DashboardShell/Nav/messages/styles.
- Tests needed: broad nav, visual, role matrix.
- Backend readiness: mixed.
- Recommendation: not now.

## Option E — No Nav Code Yet; Add Tests Around Current Behavior
- User value: low immediate, but safe.
- Risk: low.
- Files likely changed: tests only.
- Tests needed: current nav baseline and forbidden links.
- Backend readiness: ready.
- Recommendation: useful as first step inside selected slice, but not sufficient alone.
