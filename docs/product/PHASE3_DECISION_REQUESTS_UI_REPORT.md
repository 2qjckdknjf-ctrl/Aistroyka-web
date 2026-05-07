# Phase 3 Decision Requests UI Report

Date: 2026-05-07

Roadmap phase: 3 - Decision Requests

## Manager UI

Added the existing decision request manager panel to the project detail page as a first-class `Decisions` tab.

Route:

```text
/dashboard/projects/[id]?tab=decisions
```

Managers can:

- create customer decision requests
- choose finite response mechanics
- link to documents or milestones
- mark info-only requests complete
- cancel open/responded requests
- see request status in a real persisted list

## Customer UI

The existing customer portal request section remains the customer response surface:

```text
/dashboard/projects/[id]/client
```

Customers can respond to:

- approve/reject requests
- feedback requests
- acknowledgements
- choices
- document reviews

## Manager Daily Control Integration

Open customer decision requests now feed manager workload as:

```text
kind: client_request_action
action_url: /dashboard/projects/:id?tab=decisions
```

This is mapped into Manager Daily Control Center as `customer_decision_pending`.

## Validation

Actual result:

```text
Focused: 4 test files passed, 14 tests passed
PHASE3_FULL_STATUS test=0 build=0 cfbuild=0
```

## Phase 3 Verdict

PHASE 3 CLOSED: YES

