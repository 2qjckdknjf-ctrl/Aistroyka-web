# Project Subnav Role Safety Review — 2026-06-20

## Role Approach
- The subnav relies on existing project detail/dashboard access.
- It does not introduce a new auth or role policy.
- It is project-scoped and contains safe internal project navigation only.

## Role Rules
- Tenant owner/admin: may see safe project subnav through existing project detail access.
- Project manager/internal allowed role: may see safe project subnav through existing project detail access.
- Worker: no manager/admin controls are added; subnav does not include export, costs, AI admin, or finance.
- Owner/customer: internal dashboard subnav is not a portal nav.
- Stakeholder: internal dashboard subnav is not a portal nav.
- Anonymous: dashboard route remains inaccessible.

## Forbidden Links Checked
- Costs/Budget: absent.
- Internal finance: absent.
- Stakeholder finance: absent.
- Customer finance: absent.
- AI admin/Flywheel/Expert Review: absent.
- Reports export UI: absent.
- Mobile: absent.

## Safety Verdict
- Safe for this slice: YES.
