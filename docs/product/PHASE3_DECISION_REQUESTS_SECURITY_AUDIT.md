# Phase 3 Decision Requests Security Audit

Date: 2026-05-07

Roadmap phase: 3 - Decision Requests

## Access Control

Manager APIs require internal project management permissions through the existing client request policy.

Customer-safe APIs use the customer portal access policy:

- project owner membership, or
- active project stakeholder,
- with `client_portal_enabled = true`.

## Finance Isolation

Decision requests may expose a customer-facing amount only for:

- `estimate_approval`
- `cost_change_customer_facing`

Forbidden data remains excluded:

- internal actual costs
- margin
- internal overrun
- subcontractor costs
- internal cost item details
- internal budget pressure

## Audit Trail

Decision request changes are recorded in `project_client_request_events`.

Manager view may include actor ids for audit. Customer-safe view strips internal user ids through `rowToPublic`.

## Owner Namespace Note

This repo reserves `/owner` and `/api/v1/owner/*` for platform owner controls. Customer decision APIs therefore use project-scoped customer-safe aliases instead of `/api/v1/owner/*`.

## Validation

Actual result:

```text
Focused: 4 test files passed, 14 tests passed
Full validation: PHASE3_FULL_STATUS test=0 build=0 cfbuild=0
```

## Phase 3 Verdict

PHASE 3 CLOSED: YES

