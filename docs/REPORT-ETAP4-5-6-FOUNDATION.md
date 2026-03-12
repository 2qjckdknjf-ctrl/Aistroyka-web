# Report: ETAP 4–6 Foundation (Copilot, Workflows, Alerts/Events/Audit)

## 1. State before ETAP 4

**Copilot**

- `lib/copilot` already had: `copilot.types.ts`, `copilot.service.ts`, `copilot.context-builder.ts`, `copilot.prompt-builder.ts`, `copilot.output-parser.ts`, `index.ts`.
- Context builder used AI Brain async services; service called `buildCopilotContext` and, when `llmAdapter?.isAvailable()`, called `llmAdapter.generateBrief(context)` with a different shape than the prompt builder. **Prompt builder was not used** in the LLM path.
- Fallback was a single generic string (executiveHeadline + health + risk + recommendations). No clear **adapter boundary** (ILLMAdapter lived in ai-brain/types and was used directly).
- All seven use-case helpers existed and delegated to `runCopilot`.

**Workflows**

- `lib/workflows` already had: `workflow.types.ts`, `workflow-engine.ts`, `trigger-registry.ts`, `condition-evaluator.ts`, `action-dispatcher.ts`, `index.ts`.
- Engine had `runWorkflow(trigger, rules, buildContext)` returning `{ matched, executed }`; no typed execution result for audit.
- No default rule set or workflow-definitions module.

**Events / Audit**

- `lib/events`: `event.types.ts`, `index.ts` (types only; no publish/subscribe).
- `lib/audit`: `audit-ai.types.ts`, `index.ts` (types only; no recordAuditEntry / recordAiConclusionTrace / recordWorkflowTrace / recordAlert).
- `lib/observability/audit.service.ts`: `emitAudit`, `listAuditLogs` (audit_logs table).
- `lib/sre/alert.service.ts`: `createAlert`, `listAlerts` (alerts table; SRE-oriented types).

---

## 2. What was done in the Copilot layer (ETAP 4)

- **`copilot.provider.ts`**  
  - Introduced **adapter boundary**: `ICopilotProvider` with `generateFromPrompt(prompt, useCase, context)` and `isAvailable()`.  
  - `nullCopilotProvider` (always unavailable).  
  - `createAdapterCopilotProvider(llmAdapter)` wraps legacy `ILLMAdapter` so existing callers can keep passing `llmAdapter`.

- **`copilot.fallback.ts`**  
  - **Use-case-specific deterministic fallback**: `deterministicFallback(useCase, context)` returns `{ raw, structured? }` per use case (summarizeProjectStatus, summarizeDailyReports, detectTopRisks, findMissingEvidence, identifyBlockedTasks, generateManagerBrief, generateExecutiveBrief).

- **`copilot.service.ts`**  
  - Flow: build context → build prompt (`buildPrompt(useCase, context)`) → resolve provider (`copilotProvider ?? createAdapterCopilotProvider(llmAdapter) ?? nullCopilotProvider`) → if available, `provider.generateFromPrompt(prompt, useCase, context)`, else `deterministicFallback(useCase, context)` → parse → `toCopilotResponse`.  
  - Options accept both `copilotProvider` and `llmAdapter` (backward compatible).  
  - No direct LLM calls outside the provider.

- **`copilot.index.ts`**  
  - Exported: `nullCopilotProvider`, `createAdapterCopilotProvider`, `ICopilotProvider`, `CopilotProviderResult`, `deterministicFallback`.

- **Docs**  
  - Updated **`docs/COPILOT-FOUNDATION.md`**: structure, flow, real vs scaffold, extension points.

---

## 3. What was done in the Workflow engine (ETAP 5)

- **`workflow-result.ts`**  
  - `WorkflowExecutionResult` (trigger, matchedRules, executedRules, steps, at).  
  - `WorkflowExecutionStep` (ruleId, trigger, conditionsPassed, actions, executedCount, error?).  
  - `createEmptyResult(trigger)`.

- **`workflow-definitions.ts`**  
  - `DEFAULT_WORKFLOW_RULES`: example rules (risk_detected → create_alert_record; task_overdue > 3 days → notify_manager; project_health_degraded → enqueue_copilot_summary).  
  - `getDefaultRulesForTrigger(trigger)`, `getDefaultRulesByTriggerType(type)`.

- **`workflow-engine.ts`**  
  - `runWorkflowWithResult(trigger, rules, buildContext)` returns full `WorkflowExecutionResult` (steps per rule, errors).  
  - `runWorkflow` unchanged (still returns `{ matched, executed }`).

- **`workflows/index.ts`**  
  - Exported: `WorkflowExecutionResult`, `WorkflowExecutionStep`, `createEmptyResult`, `DEFAULT_WORKFLOW_RULES`, `getDefaultRulesForTrigger`, `getDefaultRulesByTriggerType`, `runWorkflowWithResult`.

- **Docs**  
  - Updated **`docs/WORKFLOW-ENGINE-FOUNDATION.md`**: structure, triggers/conditions/actions, real vs scaffold, extension points.

---

## 4. What was done in Alerts / Events / Audit (ETAP 6)

- **`lib/events/domain-events.ts`**  
  - `publishDomainEvent(event)`, `subscribeDomainEvents(fn)` (in-memory subscribers), `createDomainEvent(type, tenantId, source, payload, projectId?)`.  
  - Best-effort delivery; no persistence in this layer.

- **`lib/audit/audit.types.ts`**  
  - `AuditEntryAction`, `AuditEntryParams`, `AiConclusionTraceParams`, `WorkflowTraceParams`.

- **`lib/audit/audit.service.ts`**  
  - `recordAuditEntry(supabase, params)` → `emitAudit`.  
  - `recordAiConclusionTrace(supabase, params)` → `emitAudit` with action `copilot_brief_generated`, resource_type project, details (source, use_case, summary, risks, recommendations).  
  - `recordWorkflowTrace(supabase, params)` → `emitAudit` with action `workflow_action_dispatched`, details (trigger_type, rule_id, conditions_passed, actions_executed, error).

- **`lib/audit/alert.service.ts`**  
  - `recordAlert(supabase, params)`: platform alerts (workflow / ai_brain / copilot); maps severity to info/warn/critical and writes to existing `alerts` table (type = source, message = title + body).  
  - TODO in code: persist project_id, reason, resource when table supports them.

- **`lib/events/index.ts`**  
  - Exported: `publishDomainEvent`, `subscribeDomainEvents`, `createDomainEvent`, `DomainEventSubscriber`.

- **`lib/audit/index.ts`**  
  - Exported: audit types, `recordAuditEntry`, `recordAiConclusionTrace`, `recordWorkflowTrace`, `recordAlert`, `RecordAlertParams`, `PlatformAlertSeverity`, `PlatformAlertSource`.

- **Docs**  
  - **`docs/ALERTS-AUDIT-EVENTS-FOUNDATION.md`**: events (in-memory), audit (audit_logs), alerts (alerts table), real vs scaffold, extension points.

---

## 5. What is real vs scaffold

| Area | Real | Scaffold |
|------|------|----------|
| **Copilot** | Context from AI Brain; prompt builder; provider interface; use-case fallback; all 7 use cases callable | No default live LLM; null/deterministic until provider supplied |
| **Workflows** | Typed triggers/conditions/actions; condition evaluation; dispatch; `runWorkflowWithResult`; default in-memory rules | No rule DB; action handlers no-op until registered |
| **Events** | In-memory publish/subscribe; typed domain events | No event store; no replay |
| **Audit** | Writes to audit_logs (recordAuditEntry, recordAiConclusionTrace, recordWorkflowTrace) | — |
| **Alerts** | Writes to existing alerts table (recordAlert) | project_id/reason/resource not stored (table limit); TODO in code |

---

## 6. Files added/updated

**Added**

- `apps/web/lib/copilot/copilot.provider.ts`
- `apps/web/lib/copilot/copilot.fallback.ts`
- `apps/web/lib/workflows/workflow-result.ts`
- `apps/web/lib/workflows/workflow-definitions.ts`
- `apps/web/lib/events/domain-events.ts`
- `apps/web/lib/audit/audit.types.ts`
- `apps/web/lib/audit/audit.service.ts`
- `apps/web/lib/audit/alert.service.ts`
- `docs/ALERTS-AUDIT-EVENTS-FOUNDATION.md`
- `docs/REPORT-ETAP4-5-6-FOUNDATION.md`

**Updated**

- `apps/web/lib/copilot/copilot.service.ts` (provider + prompt + fallback flow)
- `apps/web/lib/copilot/index.ts` (provider/fallback exports)
- `apps/web/lib/workflows/workflow-engine.ts` (runWorkflowWithResult)
- `apps/web/lib/workflows/index.ts` (result, definitions, runWorkflowWithResult exports)
- `apps/web/lib/events/index.ts` (domain-events exports)
- `apps/web/lib/audit/index.ts` (audit types, audit.service, alert.service exports)
- `docs/COPILOT-FOUNDATION.md`
- `docs/WORKFLOW-ENGINE-FOUNDATION.md`

---

## 7. Build / typecheck / lint

- **Build:** `npm run build` in `apps/web` — **success** (Next.js 15.5.12).
- **Typecheck:** Part of `next build` — **no type errors**.
- **Lint:** `npm run lint` — **no ESLint warnings or errors**.

Dashboard, auth, middleware, and existing AI Brain usage were not changed; copilot context builder continues to use the same AI Brain services.

---

## 8. Risks / TODO

- **Copilot:** No rate limiting or cost control in the provider layer; add when wiring a real LLM.
- **Workflows:** Action handlers must be registered by the host; default rules are in-memory only. Persist rules and optionally execution results when moving to production.
- **Events:** In-memory only; process restarts lose subscribers and event history. Add persistence/subscriber that writes to audit or event store when needed.
- **Alerts:** `alerts` table has no project_id/reason/resource columns; `recordAlert` documents a TODO. Consider migration or separate platform_alerts table later.
- **Audit:** All writes go through existing `emitAudit` (best-effort, non-throwing). Ensure retention and access control for audit_logs.

---

## 9. Suggested next steps

1. **Wire Copilot to a real LLM:** Implement `ICopilotProvider` (or keep `createAdapterCopilotProvider` with an `ILLMAdapter` that calls your API), and pass it from config/route.
2. **Register workflow action handlers:** In the app or route that runs workflows, call `registerActionHandler` for notify_manager, create_followup_task, create_alert_record, request_missing_evidence, enqueue_copilot_summary (e.g. using audit/alert services and job queue).
3. **Use workflow result for audit:** After `runWorkflowWithResult`, call `recordWorkflowTrace` (and optionally `publishDomainEvent`) per step or for the whole result.
4. **Optional event persistence:** Add a `subscribeDomainEvents` handler that writes selected events to audit_logs or an events table.
5. **Optional alerts schema:** Add columns to `alerts` (or a new table) for project_id, reason, resource_type, resource_id and update `recordAlert`.
