# AI Brain Phase B — Approval Readiness

**Status:** Phase B  
**Date:** 2026-03-23

## Metadata on AiActionDraft

Each draft includes:
- `requiresApproval` — boolean
- `status` — proposed | draft_ready | pending_approval | approved | rejected | unavailable
- `targetEntityRefs` — linked entities (task, report, document)
- `rationale` — recommended review note
- `warnings` — blocking reasons if any

## Required Approver Role

- Inferred from action type and policy
- manager_assist actions → manager
- client_safe actions → client-facing, no approval
- create_internal_* → requires approval

## Action Readiness Status

- `draft_ready` — safe to present for review
- `pending_approval` — awaits explicit approval
- `unavailable` — module partial or forbidden
