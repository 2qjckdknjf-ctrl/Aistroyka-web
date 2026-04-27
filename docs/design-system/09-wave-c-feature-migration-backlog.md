# Wave C Backlog - Feature Surface Migration

Date: 2026-04-08

This backlog starts Wave C after Wave A (web foundation) and Wave B (mobile foundation) completion.

## Progress Snapshot
- 2026-04-08: Web P0 started with status-semantic harmonization for project-detail operational flows.
- 2026-04-08: Extended Web P0 harmonization to approvals/reports operational surfaces.
- 2026-04-08: Added portfolio command/control shared state badge mapping for governance review surfaces.
- 2026-04-08: Started P1 secondary dashboards with shared status mapping for tasks and AI request surfaces.
- 2026-04-08: Extended shared status mapping into owner/project issue and report/milestone visibility surfaces.
- 2026-04-08: Extended P1 to workload surfaces (priority and recurring rule state badges).
- Implemented unified status badge token mapping for:
  - Change orders (manager panel + manager detail + client list + client detail)
  - Service requests (manager tab + manager detail + client list + client detail)
  - Defects (manager detail + manager tab + client list + client detail)
  - Discussions (manager detail + client list + client detail)
  - Handover (manager panel)
  - Approvals/reports (approvals queue, reports list, report detail, daily-report detail, AI analysis status)
- Source-of-truth helper: `apps/web/app/[locale]/(dashboard)/dashboard/projects/[id]/statusBadgeStyles.ts`
- Source-of-truth helper (reports): `apps/web/app/[locale]/(dashboard)/dashboard/reports/reportStatusStyles.ts`
- Source-of-truth helper (portfolio): `apps/web/app/[locale]/(dashboard)/portfolio/portfolioStateStyles.ts`
- Source-of-truth helper (dashboard shared): `apps/web/app/[locale]/(dashboard)/dashboard/statusBadgeStyles.ts`
- Source-of-truth helper (workload): `apps/web/app/[locale]/(dashboard)/dashboard/workload/statusBadgeStyles.ts`

## Priority Model
- P0: critical user journeys and role-based daily workflows
- P1: high-traffic operational surfaces
- P2: long-tail and infrequent surfaces

## Web Backlog
- P0:
  - Project detail tabs with dense business actions (change orders, handover, stakeholder flows)
  - Approvals/reports detail action panels and edge states
  - Portfolio command/control pages with executive risk and governance states
- P1:
  - Admin operational pages and secondary dashboards
  - Team and workload management secondary panels
- P2:
  - Auxiliary informational pages and low-frequency admin utilities

## iOS Backlog
- P0:
  - Manager: report review flow, task assignment flow, notifications-target navigation
  - Worker: report create/submit flow, shift controls, project/task selection
- P1:
  - Manager: AI tab and team diagnostics enhancements
  - Worker: diagnostics/support surfaces
- P2:
  - Placeholder and fallback screens visual harmonization

## Android Backlog
- P0:
  - ManagerApp critical review and approval sequence states
  - WorkerApp login/home/report flow edge states
- P1:
  - Extended queue/error/retry state presentations
- P2:
  - Secondary informational and support flows

## Definition of Done per Migrated Slice
- Uses semantic tokens only (no ad-hoc raw style usage in screen nodes)
- Preserves auth, tenant scope, and existing behavior contracts
- Maintains localization and automation selector stability
- Has visual and interaction parity checks for primary/empty/error/loading states
