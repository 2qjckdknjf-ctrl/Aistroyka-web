# Dashboard Design Audit

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Current Dashboard State After PR #109

PR #109 adds a minimal project-scoped visibility slice:

- project detail subnavigation
- reports/documents/timeline/approvals reachability
- owner/admin-gated reports CSV export UI on project Reports tab
- report-review authorization hardening

Current `DashboardShell` remains a conventional authenticated dashboard shell with sidebar, topbar, locale switcher, AI guide panel, and role-gated team/admin links.

## Project Subnav Impact

`ProjectSubnav` intentionally exposes only safe project-scoped areas:

- Overview
- Reports
- Documents
- Timeline / Milestones
- Approvals / Decisions

It does not add:

- costs/budget
- internal finance
- AI admin/Flywheel
- owner/customer finance
- reports export as a nav item

Future design work must preserve this boundary.

## Reports Export UI Placement

Reports export is intentionally a small project Reports tab action and only visible to tenant owner/admin. A visual redesign must not move export into top-level nav or make it visible to manager/member/worker/stakeholder/customer roles without new tests and explicit approval.

## Role-Gated Surfaces

Risk surfaces:

- dashboard sidebar links
- admin links
- team link
- owner/customer portal sections
- project costs/budget panels
- AI/admin panels
- export actions
- report review actions

Design branches that touch dashboard shell, owner/customer panels, or admin AI pages can accidentally change visibility even without backend changes.

## Unsafe Dashboard Redesign Risks

Unsafe patterns:

- broad shell replacement from design branches
- adding costs/budget links to owner/customer areas
- exposing hidden tabs through visual nav
- replacing auth/dashboard layout without redirect tests
- importing AI/admin panels while AI schema/runtime remains blocked
- changing reports/review/export placement without RBAC tests

## Safe Future Dashboard Visual Slices

Potential safe slices after PR #109 merge:

- polish the project subnav visual treatment only
- improve empty/loading states in project reports/documents/timeline panels
- refresh public-to-dashboard visual consistency without route changes
- add small card styling improvements that do not change visibility or data

Required tests:

- `ProjectSubnav` item tests remain green
- project tab resolution tests remain green
- reports export UI helper tests remain green
- route/RBAC tests for report review remain green
- no customer finance leakage tests remain green

## Dashboard Verdict

Dashboard visual slice safe after PR #109 merge: PARTIAL.

Safe only for tiny visual polish that preserves routing, auth, RBAC, and customer finance boundaries.
