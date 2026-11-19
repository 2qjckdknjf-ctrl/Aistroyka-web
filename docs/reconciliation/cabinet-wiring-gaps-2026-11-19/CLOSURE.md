# Cabinet wiring gaps — closure

**Date:** 2026-11-19  
**Branch:** `fix/cabinet-wiring-gaps`  
**Base:** `origin/main` @ `f6f56b83`

## Verdict: YES (scoped wiring + deep portal pass)

For the audited cabinet wiring gaps in this slice, discovered user-visible breakages are fixed, required checks are green, and no known local blocker remains inside this scope.

## Pass 1 — command center / manager

| Issue | Fix |
|-------|-----|
| Portal handover pack link blocked for stakeholders | Client route `/dashboard/projects/:id/client/handover/pack` + portal links |
| Dead favorite star in `CanonPageHeader` | Removed unwired control (prop kept for compatibility) |
| Dead “⋯” more-actions button | `ProjectMoreActionsMenu` with real project links |
| Orphan manager panels | Mounted service-requests, client-requests, discussions, stakeholders, issues, commercial |
| Create-project notes written but never read | `ProjectSetupNotesBanner` on overview |
| `/dashboard/change-orders` 404 | Redirect → `/dashboard/projects` |
| Stale `?tab=aftercare` / missing change-orders & handover drilldowns | Canonical tabs + aliases (`aftercare`→`service-requests`, `activity`→`overview`) |
| AI risk radar `href="#"` | Falls back to `/dashboard/projects` |

## Pass 2 — deep portal / chrome

| Issue | Fix |
|-------|-----|
| Portal top bar search/support/help → blocked `/dashboard/*` | Portal mode: no contractor search; hide support/help |
| Notification bell → `/dashboard/notifications` for stakeholders | Portal-safe href (client `#portal-notifications` or `/portal/projects`) |
| Canon client portal missing notifications | `ClientPortalNotificationsSection` mounted with `surface="canon"` |
| Activity fallback `/portal/projects/:id` (no page) | Fallback → `/dashboard/projects/:id/client` |
| Portfolio recommended action `href ?? "#"` | Always falls back to project intelligence tab |
| Bottom nav Docs/Approvals on project list | Disabled until a client project is open |
| Sidebar portal “Projects” not active on `/client` | Uses `isDashboardNavHrefActive` |
| Portfolio missing from canon sidebar | Added `/portfolio` nav entry |
| Traceability block dead `#` | Real fallback href |

## Pass 3 — autonomous ship harden

| Issue | Fix |
|-------|-----|
| Footer feedback → `/dashboard/support` for portal | Hidden when `portalOnly` |
| Portal users had no logout in shell | Logout always available in sidebar |
| Bottom nav Documents active on empty hash | Active only for `#portal-documents` |
| Portal sidebar missing brand | Brand link to portal home |

## Pass 4 — post-PR follow-ups (same branch)

| Issue | Fix |
|-------|-----|
| `/team` open to portal-only roles | Middleware block + test |
| Wrong i18n keys (alerts / loading / creating) | Correct namespaces |
| Canon task deep links dead-end | Open full task + home links to `/tasks/:id` |
| Uploads empty state no next step | CTA to projects |
| Task title/description not editable | Edit details modal → PATCH |

PR: https://github.com/2qjckdknjf-ctrl/Aistroyka-web/pull/500

## Checks run

- `I18N_CHECK_ALL=1 bun run i18n:check` → PASS
- `vitest` focused: project-detail-tabs, stakeholder-dashboard-paths, notifications-workspace.utils, portfolio-control.signals, DashboardMobileNav → PASS (29)
- Aikido scan on touched source files → no issues

## Remaining blockers / out of scope

- Design canon Wave C / D0 visual parity (not this slice)
- Create-project structured API fields (address/client still folded into name)
- Favorites product feature (intentionally not faked)
- Legacy orphan panels `ProjectDocumentsPanel` / `ProjectSchedulePanel` (superseded by canon panels)
- `ProjectTraceabilityBlock` still unused in tree (href fixed preemptively)
- Authenticated browser E2E of portal path (`BLOCKED_EXTERNAL` without credentials)

## Next phase allowed?

Yes for the next remediation slice (e.g. D0.2 / D1 shell canon), independent of this wiring PR.
