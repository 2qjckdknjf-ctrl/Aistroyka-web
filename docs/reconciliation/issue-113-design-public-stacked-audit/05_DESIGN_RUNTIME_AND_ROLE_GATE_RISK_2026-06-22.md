# Design Runtime and Role-Gate Risk Review

Base: PR #109 HEAD `bc23c832ad03d7662c0a5db5a00a16c558712de6`

## Auth / Routing Impact in Design Branches

Design branches are not pure CSS/component branches. They touch:

- public layout/page files
- dashboard/admin AI pages
- `app/layout.tsx`, error/not-found/robots-style files in broader branches
- public header/footer
- messages
- design tokens and global CSS
- in some cases API routes and migrations

That means design work can cause runtime, routing, and auth regressions.

## Hidden Route Exposure Risks

Future design PRs must not expose:

- project costs/budget tabs to customer/owner/stakeholder surfaces
- AI Expert Review / Training Consent admin surfaces before AI audit/schema approval
- report export actions to non-owner/admin roles
- report review controls to non-manager/owner/admin users
- internal admin/operator routes in public nav

## Owner / Stakeholder / Customer Surfaces

Any design changes touching owner/customer/client portal panels need customer-finance isolation review.

Forbidden owner/customer design content:

- margin
- profitability
- budget pressure
- actual cost
- internal cost items
- subcontractor cost
- internal AI finance risk

Allowed customer-facing language remains commercial-facing only: estimates, proposals, approved amounts, payment schedule if intentionally configured, and decisions requiring customer approval.

## Role-Gate Regression Risks

High-risk changes:

- replacing `DashboardShell` link logic
- adding broad project nav groups
- moving export/review actions into generic components
- adding owner/customer panels from design branches without finance review
- changing public dashboard/cabinet entry behavior
- changing dashboard redirect/auth assumptions

## Required Tests for Future Design PRs

Before merging any design slice:

- `bun run i18n:check`
- public route render smoke or Playwright route smoke
- mobile public header Cabinet CTA check
- dashboard auth route check
- project subnav tests
- reports export UI helper tests
- report-review route auth tests
- customer finance guard tests where owner/customer UI is touched
- visual/accessibility review for focus, reduced motion, and responsive behavior

## Verdict

Role-gate risks present: YES.

Design changes can be safe, but only when isolated to a tiny surface and tested against auth, route, RBAC, and customer-finance boundaries.
