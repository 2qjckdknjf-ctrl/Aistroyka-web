# Slice 14 — Portal shell (PD-P1-05)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

Customer-facing shell for portal-only stakeholders (`tenant_members.role = stakeholder`):

- Dashboard layout detects portal-only role and passes `portalOnly` into `DashboardShell`.
- Middleware uses `redirectIfStakeholderBlockedPath` so typed URLs (`/dashboard/tasks`, contractor project list) land on `/portal/projects` or the client subtree.
- Sidebar / mobile nav reduced to `/portal/projects` (middleware-allowed). No Tasks, Help, Workers, Admin, or contractor Get Started chrome.
- Logo and blocked-path redirects land on `/portal/projects`, not the contractor projects list.
- Client portal home order: decisions → progress + next milestone → documents, then secondary lists.
- Back links go to the portal project list; handover pack preview (`/handover/pack`) is hidden for portal-only (path is not in the stakeholder allow-list).
- No internal contractor finance added.

## Out of scope

- Gantt, drawing inspector (still absent).
- Entitlement / billing cutover.
- Expanding the stakeholder path allow-list to `/dashboard/help`.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web lint
bun run --cwd apps/web test -- lib/tenant/stakeholder-dashboard-paths.test.ts lib/tenant/tenant.policy.test.ts lib/domain/client-portal/next-client-milestone.test.ts components/dashboard-nav.utils.test.ts components/dashboard/DashboardMobileNav.test.ts
```
