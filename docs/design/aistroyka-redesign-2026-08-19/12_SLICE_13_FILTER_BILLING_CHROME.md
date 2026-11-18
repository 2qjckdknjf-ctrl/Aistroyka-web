# Slice 13 — FilterBar + billing/plan-fit chrome (visual only)

**Branch:** `design/aistroyka-redesign-canonical-2026-08-19`  
**Status:** implemented (local, uncommitted)

## In scope

Visual Liquid Glass only. **No checkout, entitlement, Stripe, or plan-orchestration logic changes.**

- Cockpit `FilterBar` on glass (lists still use the same query params).
- Billing pages: `/billing`, return, cancel; subscribe plan cards.
- Plan-fit onboarding screens and current-plan surfaces.
- Billing-pilot / platform-admin billing chrome.

## Out of scope

- ENTITLEMENT_RESOLUTION_SOURCE / account-first billing switch.
- Gantt (not present in codebase).
- Drawing inspector (not present).
- Expanding stakeholder allow-list beyond portal home + client subtree.

## Validation

```bash
bun run --cwd apps/web check:design
bun run i18n:check
bun run --cwd apps/web lint
```
