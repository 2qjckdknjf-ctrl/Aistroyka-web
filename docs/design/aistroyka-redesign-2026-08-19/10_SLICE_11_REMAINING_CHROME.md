# Slice 11 — Remaining command, portal details, ops chrome

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

- Remaining Project Command panels (costs, estimate, issues, commercial, review pack, handover, stakeholders, defects, service requests, change orders, client requests, customer estimates).
- Remaining client-portal list/detail pages (defects, discussions, service requests, change orders, requests).
- Workload inbox, recurring ops, stakeholder invite, dashboard intelligence alerts.
- Governance cases list/detail chrome (dashboard ops, not platform admin).
- Leftover contractor chrome: portfolio command view, `/projects` intelligence blocks, task chat, help/onboarding banners, public proof-pack share.

Contractor-internal cost/estimate panels stay on the manager project tabs only — portal files were not given new finance fields.

## Out of scope

- Admin/operator/billing shells.
- Gantt / drawing inspector.
- Portal IA rewrite (PD-P1-05).

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web lint
```
