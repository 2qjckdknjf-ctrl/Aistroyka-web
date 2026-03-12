# Workflow Engine Foundation

## Overview

The workflow engine reacts to **triggers** (report_submitted, report_missing, task_overdue, risk_detected, missing_evidence_detected, project_health_degraded), evaluates **conditions**, and dispatches **actions**. It is a domain layer: no workflow logic in UI or route handlers. Action implementations are stubs until the host registers real handlers.

## Structure

| File | Role |
|------|------|
| `workflow.types.ts` | `TriggerType`, `ActionType`, `ConditionKind`, `WorkflowTrigger`, `WorkflowRule`, `WorkflowContext`, etc. |
| `trigger-registry.ts` | Payload keys per trigger, `isTriggerType`, `validateTriggerPayload` |
| `condition-evaluator.ts` | `evaluateCondition`, `evaluateAllConditions` (severity_gte, overdue_days_gt, evidence_missing, repeated_problem_count, project_risk_score_gte) |
| `action-dispatcher.ts` | `registerActionHandler`, `dispatchAction`, `dispatchActions`; default handlers are no-op |
| `workflow-engine.ts` | `runWorkflow`, `runWorkflowWithResult`, `buildContextFromTrigger` |
| `workflow-result.ts` | `WorkflowExecutionResult`, `WorkflowExecutionStep`, `createEmptyResult` for audit/tracing |
| `workflow-definitions.ts` | `DEFAULT_WORKFLOW_RULES`, `getDefaultRulesForTrigger`, `getDefaultRulesByTriggerType` (scaffold rules) |

## Triggers

- `report_submitted`, `report_missing`, `task_overdue`, `risk_detected`, `missing_evidence_detected`, `project_health_degraded`

## Conditions

- `severity_gte` — severity ≥ threshold
- `overdue_days_gt` — overdue > n days
- `evidence_missing` — missing evidence count > 0
- `repeated_problem_count` — count ≥ n
- `project_risk_score_gte` — risk score ≥ threshold

## Actions

- `notify_manager`, `create_followup_task`, `create_alert_record`, `request_missing_evidence`, `enqueue_copilot_summary`

All action handlers are no-op by default; register via `registerActionHandler(type, handler)`.

## What is real vs scaffold

- **Real:** Typed triggers/conditions/actions; condition evaluation; dispatch loop; `runWorkflowWithResult` for full execution trace; default rule set (in-memory).
- **Scaffold:** No rule persistence (DB); action handlers are no-op until the host wires them (e.g. in API or cron).

## Extension points

1. **Rules:** Replace `getDefaultRulesForTrigger` with DB/config lookup.
2. **Handlers:** At startup or in the route that runs workflows, call `registerActionHandler("notify_manager", ...)`, etc.
3. **Audit:** Use `runWorkflowWithResult` and pass `result.steps` to the audit layer (`recordWorkflowTrace`).
