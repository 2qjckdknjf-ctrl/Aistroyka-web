# Reports Export UI Go / No-Go — 2026-06-20

## Decision
- Safe to implement next: YES, with constraints.
- Selected option: Option B.
- Selected placement: project Reports tab.

## Allowed Roles
- Tenant owner.
- Tenant admin.

## Required Tests
- Export URL includes `/api/v1/reports/export?project_id=...`.
- Forbidden params absent.
- Owner/admin visibility if safe role prop exists.
- Worker/customer/stakeholder hidden if safe role prop exists.
- i18n labels pass.

## Blockers
- Project detail currently does not obviously receive owner/admin role context.
- If no safe server-derived owner/admin prop exists, implementation must first add safe role plumbing or limit to a helper/test-only step.

## Must Not Include
- Project export.
- Finance export.
- Customer/stakeholder export.
- Manager visibility without explicit backend policy.
- AI.
- Mobile.
- Liquid Glass.
- Public redesign.
