# Report: AI Construction Brain Foundation

## 1. Audit Findings

- **Web / app:** Next.js App Router; dashboard under `app/[locale]/(dashboard)/`; existing auth, i18n, tenant context.
- **API:** Many routes under `app/api/v1/` (projects, tasks, reports, worker, org, admin, billing, etc.); tenant-scoped access via `getTenantContextFromRequest` and `requireTenant`.
- **Domain:** `lib/domain/` — projects (project.repository, project-summary.repository), reports (report.repository, report.service), tasks (task.repository), media, upload-session; no dedicated “AI brain” layer.
- **AI today:** `lib/platform/ai/ai.service.ts` (vision), `lib/ai/types.ts`; analysis jobs (ai-analyze-media, ai-analyze-report); no copilot/workflow/insight abstractions.
- **Observability:** `lib/observability/audit.service.ts` (emitAudit, listAuditLogs); no domain events or alert records for AI/workflow.
- **Extension points:** No formal extension points for copilot, workflows, API gateway, integrations, or audit of AI conclusions; they were added in this foundation.

## 2. Domain Models Introduced

All under **`lib/ai-brain/domain/`** (and re-exported from `lib/ai-brain`):

- **ProjectSnapshot** — point-in-time aggregate (workers, reports, tasks, overdue, media, analysis count).
- **ProjectHealth** — score 0–100, label (healthy | moderate | unstable | critical), blockers, missingData, delayIndicators.
- **TaskSignal**, **ReportSignal**, **EvidenceSignal** — per-entity signals (overdue, missing, partial, etc.).
- **RiskSignal**, **DelaySignal**, **MissingEvidenceSignal**, **WorkforceSignal** — aggregated or specialized signals.
- **ManagerInsight**, **ExecutiveSummary**, **ActionRecommendation**, **AlertEvent** — outputs for UI and audit.
- **SignalSeverity** — low | medium | high.

No changes to existing Supabase entities; AI brain works as an interpretation layer on top.

## 3. AI Brain Services

- **project-health.service** — `computeProjectHealth(snapshot)` from snapshot.
- **report-intelligence.service** — `getReportSignals(supabase, projectId, tenantId)` from worker_day / worker_reports.
- **evidence-intelligence.service** — `getEvidenceSignals(...)` from media and tasks (project-level and scaffold for task-level).
- **risk-intelligence.service** — `aggregateRiskSignals(inputs)`, `getRiskOverview(signals)`.
- **executive-summary.service** — `buildExecutiveSummary(inputs)`.
- **recommendation-engine.service** — `getActionRecommendations(inputs)`.

Mappers: **snapshot.mapper** (`buildProjectSnapshot`), **task-signals.mapper** (`getTaskSignals`).

## 4. Copilot Engine

- **lib/copilot/** — types, context-builder (from AI brain), prompt-builder, output-parser, service with `runCopilot` and use-case helpers: `summarizeProjectStatus`, `summarizeDailyReports`, `detectTopRisks`, `findMissingEvidence`, `identifyBlockedTasks`, `generateManagerBrief`, `generateExecutiveBrief`.
- Deterministic fallback when no `ILLMAdapter` is provided; adapter boundary ready for future LLM.

## 5. Workflow Engine

- **lib/workflows/** — workflow.types (triggers, conditions, actions, rules, context), trigger-registry, condition-evaluator, action-dispatcher (no-op handlers by default), workflow-engine (`runWorkflow`, `buildContextFromTrigger`).
- Trigger types: report_submitted, report_missing, task_overdue, risk_detected, missing_evidence_detected, project_health_degraded.
- Action types: notify_manager, create_followup_task, create_alert_record, request_missing_evidence, enqueue_copilot_summary.
- Condition kinds: severity_gte, overdue_days_gt, evidence_missing, repeated_problem_count, project_risk_score_gte.

## 6. Events / Audit / Integration Layer

- **lib/events/** — event.types (DomainEvent, AlertRecord); no persistence yet.
- **lib/audit/** — audit-ai.types (AuditActionAI, AuditAIParams) for extending existing audit.service.
- **lib/integrations/** — integration.types, base-adapter, adapters (erp, document, storage, bim, webhook), integration-registry.

## 7. API and Webhooks

- **API:** Existing `app/api/v1/*` unchanged. New route: **GET /api/v1/projects/:id/insights** — returns manager insights (tenant + project scoped). Direction documented in docs/API-FOUNDATION.md.
- **Webhooks:** **POST /api/webhooks/incoming** — scaffold (accepts JSON, returns received/eventType); signing and replay protection not implemented.

## 8. UI Integration Points

- No UI changes in dashboard or admin views.
- **Entry point for platform intelligence:** GET `/api/v1/projects/[id]/insights` can be used by dashboard or admin to render a “Manager insights” or “Risk summary” panel. Recommended places: project detail page or dashboard overview; use the same auth as other project APIs.

## 9. What Is Real vs Scaffold

| Component | Real | Scaffold |
|-----------|------|----------|
| AI Brain domain types | ✓ | |
| Snapshot / task/report/evidence mappers | ✓ | Task-level evidence count when schema allows |
| Project health, report/evidence/risk services | ✓ | |
| Executive summary, recommendations | ✓ | |
| Copilot context + deterministic fallback | ✓ | Live LLM not wired |
| Workflow engine (types, conditions, dispatch) | ✓ | No rule storage; actions are no-op until registered |
| Events/audit types | ✓ | No persistence of domain events/alerts |
| Integrations | ✓ | Adapters are stubs (healthCheck returns ok) |
| Webhooks | ✓ | Incoming route only; no signing/replay |
| API insights route | ✓ | |

## 10. Architectural Risks / Limitations

- **Rule storage:** Workflow rules are not persisted; engine expects rules to be passed in. Next step: table or config for rules and loading by tenant/trigger.
- **Action side effects:** Notify, create task, create alert, enqueue copilot are no-op until handlers are registered and integrated with existing notifications/tasks/jobs.
- **Portfolio-level executive summary:** Only single-project executive summary implemented; portfolio aggregation is future work.
- **LLM:** Copilot uses deterministic summary until an `ILLMAdapter` is implemented and passed from config.

## 11. Files Changed / Created

**New files:**

- `apps/web/lib/ai-brain/domain/signals.types.ts`
- `apps/web/lib/ai-brain/domain/index.ts`
- `apps/web/lib/ai-brain/types.ts`
- `apps/web/lib/ai-brain/config.ts`
- `apps/web/lib/ai-brain/mappers/snapshot.mapper.ts`
- `apps/web/lib/ai-brain/mappers/task-signals.mapper.ts`
- `apps/web/lib/ai-brain/mappers/index.ts`
- `apps/web/lib/ai-brain/services/project-health.service.ts`
- `apps/web/lib/ai-brain/services/report-intelligence.service.ts`
- `apps/web/lib/ai-brain/services/evidence-intelligence.service.ts`
- `apps/web/lib/ai-brain/services/risk-intelligence.service.ts`
- `apps/web/lib/ai-brain/services/executive-summary.service.ts`
- `apps/web/lib/ai-brain/services/recommendation-engine.service.ts`
- `apps/web/lib/ai-brain/services/index.ts`
- `apps/web/lib/ai-brain/use-cases/manager-insights.use-case.ts`
- `apps/web/lib/ai-brain/use-cases/executive-summary.use-case.ts`
- `apps/web/lib/ai-brain/use-cases/risk-evidence-reporting.use-case.ts`
- `apps/web/lib/ai-brain/use-cases/index.ts`
- `apps/web/lib/ai-brain/index.ts`
- `apps/web/lib/copilot/copilot.types.ts`
- `apps/web/lib/copilot/copilot.context-builder.ts`
- `apps/web/lib/copilot/copilot.prompt-builder.ts`
- `apps/web/lib/copilot/copilot.output-parser.ts`
- `apps/web/lib/copilot/copilot.service.ts`
- `apps/web/lib/copilot/index.ts`
- `apps/web/lib/workflows/workflow.types.ts`
- `apps/web/lib/workflows/trigger-registry.ts`
- `apps/web/lib/workflows/condition-evaluator.ts`
- `apps/web/lib/workflows/action-dispatcher.ts`
- `apps/web/lib/workflows/workflow-engine.ts`
- `apps/web/lib/workflows/index.ts`
- `apps/web/lib/events/event.types.ts`
- `apps/web/lib/events/index.ts`
- `apps/web/lib/audit/audit-ai.types.ts`
- `apps/web/lib/audit/index.ts`
- `apps/web/lib/integrations/integration.types.ts`
- `apps/web/lib/integrations/base-adapter.ts`
- `apps/web/lib/integrations/adapters/erp-adapter.ts`
- `apps/web/lib/integrations/adapters/document-adapter.ts`
- `apps/web/lib/integrations/adapters/storage-adapter.ts`
- `apps/web/lib/integrations/adapters/bim-adapter.ts`
- `apps/web/lib/integrations/adapters/webhook-adapter.ts`
- `apps/web/lib/integrations/integration-registry.ts`
- `apps/web/lib/integrations/index.ts`
- `apps/web/app/api/webhooks/incoming/route.ts`
- `apps/web/app/api/v1/projects/[id]/insights/route.ts`
- `docs/AI-BRAIN-ARCHITECTURE.md`
- `docs/COPILOT-FOUNDATION.md`
- `docs/WORKFLOW-ENGINE-FOUNDATION.md`
- `docs/INTEGRATION-LAYER-FOUNDATION.md`
- `docs/API-FOUNDATION.md`
- `docs/REPORT-AI-CONSTRUCTION-BRAIN-FOUNDATION.md` (this file)

**Modified:** None of the existing dashboard, auth, middleware, tenant logic, or production routes were changed.

## 12. Build / Typecheck / Lint

- **Build:** `npm run build --workspace=apps/web` — compiles successfully; lint and type-check run as part of the build. Fixes applied during implementation: task-signals.mapper `due_date` null check, executive-summary.service `healthLabel` type, condition-evaluator exhaustive switch (`condition.kind`).
- **Lint:** No linter errors reported for `lib/ai-brain`, `lib/copilot`, `lib/workflows` (read_lints).
- **Recommendation:** Run `npm run build --workspace=apps/web` and `npm run lint --workspace=apps/web` in CI to confirm.

## 13. Next Steps

1. **UI:** Add a “Manager insights” or “Risk summary” panel on the project page (or dashboard) that calls GET `/api/v1/projects/:id/insights` and displays the list.
2. **Workflow persistence:** Add table(s) for workflow rules and optionally for execution log; load rules in API or job handler and call `runWorkflow`.
3. **Action handlers:** Register real implementations for `notify_manager`, `create_alert_record`, etc., with existing notification and audit services.
4. **Copilot LLM:** Implement `ILLMAdapter` using OpenAI (or other provider), read `lib/ai-brain/config`, and pass the adapter into Copilot when available.
5. **Audit:** When generating insights or running workflows, call `emitAudit` with `AuditActionAI` and details for explainability.
6. **Webhooks:** Add signature verification and replay protection for incoming webhooks; define event types and persistence if needed.
7. **Portfolio executive summary:** Aggregate multiple projects for a tenant or portfolio and return a single executive summary.
