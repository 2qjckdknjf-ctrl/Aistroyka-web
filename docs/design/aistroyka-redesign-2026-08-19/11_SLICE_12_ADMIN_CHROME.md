# Slice 12 — Tenant admin & dashboard-adjacent chrome

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

Visual Liquid Glass only (no RBAC, API, or entitlement changes):

- Tenant `/admin` chrome: overview, jobs, push, operator, leads, AI runtime/guide/security/requests, trust, governance.
- Shared `AdminKpiCard`.
- Dashboard-adjacent: Telegram connect, demo project card, onboarding wizard, auth methods settings.
- Platform owner leads/testing lists (not billing).

## Explicitly not converted

- Billing / subscribe / plan-fit / billing-pilot (production billing behavior stays identical).
- Gantt / drawing inspector.
- Portal IA rewrite.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web lint
```
