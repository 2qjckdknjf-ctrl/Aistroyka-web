# Phase 1 — Semantic Model (Approvals Layer Closure)

**Date:** 2026-04-18  
**Stage:** B — Semantic Model

## Target Behavior

Phase 1 must close one coherent approvals loop:

1. Worker submits artifact for review.
2. Manager sees pending item in approvals workload.
3. Manager can choose exactly one action:
   - `approve`
   - `reject`
   - `request_changes`
4. If `request_changes`, worker can resubmit.
5. Every decision and resubmission is auditable in history.

## Entities

- `worker_reports` (primary Phase 1 approval subject).
- `report_approval_events` (append-only event log).
- Manager approvals workload view/model (UI + query semantics).

## State Machine (report approval)

- `draft` -> `submitted` (worker submit)
- `submitted` -> `approved` (manager approve)
- `submitted` -> `rejected` (manager reject)
- `submitted` -> `changes_requested` (manager request changes)
- `changes_requested` -> `submitted` (worker resubmit)

Forbidden transitions:

- review actions from non-`submitted` states,
- resubmit from states other than `changes_requested`,
- silent status mutations without event logging.

## Ownership

- Worker owns submission/resubmission from own reports.
- Manager (review-capable role) owns decisions.
- Tenant and role enforcement remains mandatory through existing guards.

## Closure Criteria (Phase 1)

Phase 1 is `YES` only if all are true:

1. Decision semantics are explicit and consistent in API + UI.
2. Manager has practical queue/triage flow for pending approvals.
3. `changes_requested -> resubmit` path is product-real and validated.
4. Approval history is explicit and audit-usable for the loop.
5. Post-audit finds no meaningful P1 approvals tail.

If any item fails, verdict is `NO`.
