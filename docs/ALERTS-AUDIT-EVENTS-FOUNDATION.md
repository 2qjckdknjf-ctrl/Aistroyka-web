# Alerts / Events / Audit Foundation

## Overview

Foundation for **explainability** and **traceability**: domain events, audit entries for AI/workflow, and platform alert records. AI conclusions and workflow actions can be traced; alerts are a separate concept from UI notifications.

## Structure

### Events (`lib/events`)

| File | Role |
|------|------|
| `event.types.ts` | `DomainEventType`, `DomainEvent`, `AlertRecord` (types only) |
| `domain-events.ts` | `publishDomainEvent`, `subscribeDomainEvents`, `createDomainEvent` — in-memory pub/sub |

Events are in-memory only; persistence can be added by subscribing and writing to `audit_logs` or a dedicated store.

### Audit (`lib/audit`)

| File | Role |
|------|------|
| `audit.types.ts` | `AuditEntryParams`, `AiConclusionTraceParams`, `WorkflowTraceParams` |
| `audit.service.ts` | `recordAuditEntry`, `recordAiConclusionTrace`, `recordWorkflowTrace` — delegate to `observability/audit.service` (audit_logs table) |
| `alert.service.ts` | `recordAlert` — platform alerts (workflow/ai_brain/copilot) into existing `alerts` table |
| `audit-ai.types.ts` | Legacy `AuditActionAI`, `AuditAIParams` (still supported) |

## Supported operations

- **recordAuditEntry(supabase, params)** — Generic audit entry (action, resource_type, resource_id, details).
- **recordAiConclusionTrace(supabase, params)** — AI/copilot conclusion (project_id, source, use_case, summary, risks, recommendations).
- **recordWorkflowTrace(supabase, params)** — Workflow step (trigger_type, rule_id, conditions_passed, actions_executed, error).
- **recordAlert(supabase, params)** — Platform alert (tenantId, type, severity, title, body, reason, source: workflow | ai_brain | copilot). Uses existing `alerts` table; severity mapped to info/warn/critical.
- **publishDomainEvent(event)** — Publish to in-memory subscribers.
- **subscribeDomainEvents(fn)** — Subscribe; returns unsubscribe.

## What is real vs scaffold

- **Real:** Audit entries and AI/workflow traces are written to `audit_logs` via existing `emitAudit`. Alerts are written to existing `alerts` table (type = source). Domain events are delivered to in-memory subscribers.
- **Scaffold:** No dedicated event store; no replay; alert table does not yet have project_id/reason/resource columns (TODO in code). Subscribers must be registered (e.g. to forward events to audit).

## Extension points

1. **Event persistence:** Add a subscriber that writes `DomainEvent` to a table or audit.
2. **Alert schema:** Add columns to `alerts` for project_id, reason, resource_type/id and update `recordAlert`.
3. **Replay protection:** Add idempotency keys or event IDs when persisting events.
