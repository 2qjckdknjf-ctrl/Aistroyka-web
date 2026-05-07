# Phase 3 — Decision requests (domain)

**Phase:** 3 — Decision requests  
**Date:** 2026-05-07  
**Status:** Implemented on `project_client_requests` (+ events), not a separate `decision_requests` table.

## Intent

Move customer decisions (approvals, choices, Q&A, document review) into a structured workflow with explicit types, priorities, due dates, and an audit trail—without exposing internal company finances.

## Storage model

| Concept | Table | Notes |
|--------|--------|--------|
| Request / “decision” | `project_client_requests` | Canonical row: `kind`, `action_mode`, `status`, `decision_type`, `due_at`, optional `customer_visible_amount` / currency (only for commercial-facing types). |
| Audit log | `project_client_request_events` | Append-only events: `created`, `responded`, `cancelled`, `completed` (see event audit). |

**Statuses in product** (differs from early roadmap sketch): `open` → `responded` → `completed` (manager), or `cancelled`; not `pending/approved/answered` literals.

**Decision types** (`decision_type`): `design_choice`, `material_choice`, `estimate_approval`, `cost_change_customer_facing`, `schedule_change`, `document_approval`, `work_acceptance`, `general_question`, `other`.

**Kind mapping** (`kind`): drives validation for stakeholder response (`approve_or_reject`, `feedback`, `acknowledge`, `choice`, `document_review`) — see `decision-requests.adapter.ts`.

## Customer-visible amount rule

- Allowed only when `decision_type` is `estimate_approval` or `cost_change_customer_facing`.
- Enforced in `createClientRequest`; aligns with meg roadmap §705–715 (no internal costs, margin, or cost items).

## Service API (domain)

| Operation | Function | Notes |
|-----------|----------|--------|
| Create | `createClientRequest` | Manager; validates links to document/milestone; writes `created` event. |
| List | `listClientRequests` | `viewer: manager \| stakeholder`; status filter. |
| Get + history | `getClientRequest` | Manager gets `history` (events); stakeholder gets public shape only. |
| Respond | `respondToClientRequest` | Stakeholder; `responded` event with payload details. |
| Manager patch | `patchClientRequestByManager` | `completed` / `cancelled` + events. |

## HTTP mapping (canonical)

| Roadmap name | Implementation |
|--------------|----------------|
| `POST/GET .../decision-requests` | `/api/v1/projects/:id/decision-requests` |
| `PATCH .../decision-requests/:requestId` | `/api/v1/projects/:id/decision-requests/:requestId` |
| Owner `GET .../decisions` | `GET /api/v1/portal/projects/:id/decisions` (+ client view read model) |
| Owner `POST .../decisions/:id/respond` | `POST /api/v1/portal/projects/:id/decisions/:requestId/respond` (alias of `client-requests/.../respond`) |

## References

- `apps/web/lib/domain/client-requests/*`
- `apps/web/lib/domain/decision-requests/decision-requests.adapter.ts`
- Audit details: `docs/audit/PHASE3_CLIENT_REQUEST_EVENTS_AUDIT.md`
