# AI Brain Phase B — Action Model Spec

**Status:** Phase B  
**Date:** 2026-03-23

## Action Types

### READ-ONLY / NO SIDE EFFECT
- `explain_state`
- `summarize_for_manager`
- `summarize_for_client`

### DRAFT-ONLY / INTERNAL SAFE
- `draft_followup_task`
- `draft_report_review_note`
- `draft_request_more_evidence`
- `draft_manager_escalation`
- `draft_client_update`
- `draft_document_followup`
- `draft_approval_followup`

### EXECUTION-CANDIDATE (only if existing services support)
- `create_internal_task_draft` — task.service.createTask
- `create_internal_followup_note` — proposal only in Phase B
- `create_internal_notification_draft` — proposal only

## Risk Levels

- `read_only` — no side effects
- `draft_only` — creates draft/proposal; no persistence of high-impact state
- `low` — safe internal draft (e.g., task draft)
- `medium` — requires approval
- `high` — blocked or approval-only

## AiActionDraft Fields

- actionId, tenantId, projectId, requestedBy, mode, actionType, riskLevel
- requiresApproval, status, title, rationale, factsUsed, inferredReasoningSummary
- targetEntityRefs, payload, availabilityFlags, warnings, createdAt

## Rules

1. Separate facts from inference
2. No raw LLM output unvalidated
3. Strict schema validation (Zod)
