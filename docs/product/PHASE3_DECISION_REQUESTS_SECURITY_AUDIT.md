# Phase 3 — Decision requests (security audit)

**Scope:** Manager vs stakeholder access to decision/client requests, finance isolation, audit visibility.  
**Date:** 2026-05-07

## Threat model (abbrev.)

- **T1** Stakeholder reads another tenant’s requests or manager-only fields.  
- **T2** Stakeholder receives internal actor IDs or internal cost data via API or history.  
- **T3** Customer-visible amount used to smuggle internal cost narrative.  
- **T4** Unauthenticated or wrong-role access to create/cancel/complete.

## Controls

| Area | Control |
|------|---------|
| Tenant / project scope | All queries filter `tenant_id`; project id validated on row. |
| Manager-only actions | `createClientRequest`, `patchClientRequestByManager`, list with `viewer: manager` require `canManageClientRequests`. |
| Stakeholder read/respond | `canStakeholderAccessClientRequests` / `canRespondToClientRequests` (portal + membership). |
| Public shape | `rowToPublic` omits `requested_by`, `responded_by`, `cancelled_by`, `completed_by`. |
| History | `getClientRequest(..., "manager")` returns `project_client_request_events`; stakeholder path does **not** return history. |
| Commercial fields | `customer_visible_amount` only with `estimate_approval` or `cost_change_customer_facing` — enforced in service. |

## API surface

- Manager: `/api/v1/projects/:id/decision-requests`, `/decision-requests/:requestId`.  
- Portal respond alias: `/api/v1/portal/projects/:id/decisions/:requestId/respond`.  
- No exposure of `project_cost_items` or internal budget APIs on these routes.

## Tests / evidence

- `app/api/v1/projects/[id]/decision-requests/route.test.ts` (list/create).  
- `app/api/v1/portal/projects/[id]/decisions/[requestId]/respond/route.test.ts` (delegation).  
- `client-requests.service.test.ts` (policy + public strip).  
- Stakeholder / portal route tests (Phase 2) reuse client-view gates.

## Findings

- **None blocking** for Phase 3 closure.  
- **Residual:** Event payloads may contain `response_value` (e.g. approve/reject, choice index, or customer feedback text) — intended for **manager-only** audit via `history`; not returned on stakeholder `getClientRequest`.

## Verdict

**Accept for Phase 3** — roles enforced, customer view remains finance-safe, audit trail available to managers.
