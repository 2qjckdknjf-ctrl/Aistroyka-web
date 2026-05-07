# Phase 3 Decision Requests Domain

Date: 2026-05-07

Roadmap phase: 3 - Decision Requests

## Domain Decision

The repo already has a shipped, auditable customer decision workflow:

```text
project_client_requests
project_client_request_events
```

Phase 3 formalizes this as the canonical Decision Requests domain instead of creating a duplicate table. The table has been extended with roadmap fields:

- `decision_type`
- `priority`
- `assigned_to`
- `due_at`
- `decided_at`
- `decision_note`
- `customer_visible_amount`
- `customer_visible_currency`

## Canonical Types

Supported `decision_type` values:

- `design_choice`
- `material_choice`
- `estimate_approval`
- `cost_change_customer_facing`
- `schedule_change`
- `document_approval`
- `work_acceptance`
- `general_question`
- `other`

Existing response mechanics remain finite and validated through:

- approve/reject
- feedback
- acknowledge
- choice
- document review

## APIs

Manager:

```text
GET /api/v1/projects/:id/decision-requests
POST /api/v1/projects/:id/decision-requests
GET /api/v1/projects/:id/decision-requests/:requestId
PATCH /api/v1/projects/:id/decision-requests/:requestId
```

Customer-safe aliases in this repo:

```text
GET /api/v1/projects/:id/decisions
POST /api/v1/projects/:id/decisions/:requestId/respond
```

The roadmap's `/api/v1/owner/*` naming is intentionally not used because `/owner` is already the platform owner cabinet in this codebase.

## Customer Visible Amount Rule

`customer_visible_amount` is allowed only for:

- `estimate_approval`
- `cost_change_customer_facing`

It is never derived from internal `project_cost_items`, actual cost, margin, subcontractor cost, or internal budget pressure.

## Audit Trail

State changes are recorded in:

```text
project_client_request_events
```

Events include:

- `created`
- `responded`
- `completed`
- `cancelled`
- `updated`

## Validation

Actual result:

```text
Focused: 4 test files passed, 14 tests passed
Lint: No ESLint warnings or errors
Full tests: 251 test files passed, 1368 tests passed
Build: PASS
Cloudflare build: PASS
PHASE3_FULL_STATUS test=0 build=0 cfbuild=0
```

## Phase 3 Verdict

PHASE 3 CLOSED: YES

