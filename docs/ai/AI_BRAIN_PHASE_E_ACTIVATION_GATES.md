# AI Brain Phase E — Activation Gates

## Overview

Even if a proposal/package/experiment looks good, nothing becomes live without explicit gating. **Phase E: live activation NOT permitted.**

## Gate States

- not_ready — Proposal/package not ready for review
- ready_for_review — Awaiting review
- approved_sandbox — Approved for sandbox use
- approved_canary_prep — Approved for canary preparation (still no live)
- rejected — Rejected
- needs_revision — Needs revision

## Decision Types

- approve_for_canary — Approve for canary prep (NOT live activation)
- reject — Reject
- revise — Request revision
- hold — Hold for further review

## Constants

- `LIVE_ACTIVATION_PERMITTED` — Always `false` in Phase E

## API

- `evaluateActivationGate({ proposal, package, experiment, latestDecision })` — Returns gate state
- `canProceedToSandbox(gate)` — Whether sandbox allowed
- `isRejected(gate)` — Whether rejected/needs_revision
