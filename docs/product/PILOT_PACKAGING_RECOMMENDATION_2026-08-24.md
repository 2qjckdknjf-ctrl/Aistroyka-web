# Pilot Packaging Recommendation — 2026-08-24

## Principles

- Sell **controlled execution with evidence**, not AI magic.
- Do not charge per read-only owner/stakeholder seat.
- Do not expose per-call AI pricing to users; measure cost internally.
- Pilot KPIs: missed reports ↓, issue detection ↑, site visits ↓.

## Tiers

### Core (pilot default)

- Daily worker reports + before/after photos
- Manager review workflow
- Server completeness checks
- Governed low-risk automations (reminders, field validation)
- Basic AI draft summaries (manager-approved)

### Growth

- Additional projects
- Higher AI/automation limits
- Owner portal (overview + visual progress)
- Extended reports and integrations
- Custom workflow templates

### Enterprise

- Stakeholder governance + SSO
- Extended audit retention
- Custom integrations
- Future agent tool layer API
- Data residency options
- Legal/security documentation pack

## Pilot recommendation

Launch **Core + selective Growth** (owner portal) for first 5 workers / 3 managers without separate AI SKU. Track AI cost per tenant internally via `ai_usage` and governed action audit.

## Deferred packaging decisions

- Stripe SKU changes — **not in this branch** (production billing unchanged).
- Per-seat stakeholder pricing — **avoid**.
