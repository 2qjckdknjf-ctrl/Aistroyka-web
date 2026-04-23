# AI Brain Phase A — Repo Inventory

**Status:** Complete  
**Date:** 2026-03-22

## A. Existing AI / Copilot Files and Ownership

| Location | Role | Status |
|----------|------|--------|
| `apps/web/lib/ai-brain/` | Main intelligence layer | **FULLY REAL** |
| `apps/web/lib/ai-brain/services/` | Health, risk, evidence, executive summary, top-risks, missing-evidence, milestone-pressure, cost-signals, schedule-pressure | **FULLY REAL** |
| `apps/web/lib/ai-brain/use-cases/` | manager-insights, executive-summary, risk-evidence-reporting | **FULLY REAL** |
| `apps/web/lib/ai-brain/domain/` | signals.types, intelligence-output.types | **FULLY REAL** |
| `apps/web/lib/ai-brain/mappers/` | snapshot.mapper, task-signals.mapper | **FULLY REAL** |
| `apps/web/lib/copilot/` | Context builder, fallback, context budget, provider | **FULLY REAL** |
| `apps/web/lib/platform/ai/` | Providers (OpenAI, Anthropic, Gemini), circuit breaker, routing | **FULLY REAL** |
| `apps/web/lib/ai/` | Construction brain, vision analysis, stages, prompts | **FULLY REAL** |
| `apps/web/lib/platform/ai-governance/` | Policy, PII redaction, model routing | **FULLY REAL** |
| `apps/web/lib/platform/ai-usage/` | Usage tracking, cost estimator | **FULLY REAL** |

### Streaming Routes
- `POST /api/v1/projects/[id]/copilot/chat/stream` — **FULLY REAL** — SSE streaming, context budget, fallback

### Non-Streaming Copilot
- `GET /api/v1/projects/:id/copilot` — **FULLY REAL** — Use cases: summarizeProjectStatus, detectTopRisks, findMissingEvidence, identifyBlockedTasks, generateManagerBrief, generateExecutiveBrief, summarizeDailyReports

### Intelligence Route
- `GET /api/v1/projects/:id/intelligence` — **FULLY REAL** — Aggregates health, insights, riskOverview, evidenceCoverage, reportingDiscipline, executiveSummary, recommendations, missingEvidenceInsights, topRiskInsights, executiveProjectSummary, projectHealthScore

### Output Contracts (Existing)
- `ExecutiveProjectSummary`, `ProjectHealthScore`, `TopRiskInsight`, `MissingEvidenceInsight` — **FULLY REAL** — In `intelligence-output.types.ts`

---

## B. Domain Truth Sources

| Domain | Repository/Service | Status |
|--------|---------------------|--------|
| Projects | `project.repository`, `project.service`, `project-summary.repository` | **FULLY REAL** |
| Tasks | `task.repository`, `worker_tasks` via ai-brain mappers | **FULLY REAL** |
| Reports | `report-intelligence.service`, report signals | **FULLY REAL** |
| Evidence/Media | `evidence-intelligence.service`, `evidence-staleness.service` | **FULLY REAL** |
| Risks | `risk-intelligence.service`, `top-risks.service` | **FULLY REAL** |
| Milestones/Schedule | `milestone.repository`, `milestone-pressure.service`, `schedule-pressure.service` | **FULLY REAL** |
| Costs/Budget | `cost.repository`, `cost-signals.service` | **FULLY REAL** |
| Documents | `document.repository`, `document.service` | **FULLY REAL** |
| Approvals | Report approvals, document approvals | **PARTIAL** — no dedicated approval-pressure service |
| Issues | `issue.repository`, `issue.service` | **FULLY REAL** |
| Notifications | `notifications` API | **FULLY REAL** |

---

## C. Manager / Client / Worker Surfaces

| Surface | Route/Component | Status |
|---------|-----------------|--------|
| Manager intelligence | `GET /api/v1/projects/:id/intelligence` | **FULLY REAL** |
| Manager copilot | `GET /api/v1/projects/:id/copilot`, streaming chat | **FULLY REAL** |
| Project insights | `GET /api/v1/projects/:id/insights` | **FULLY REAL** |
| Attention | `GET /api/v1/projects/:id/attention` | **FULLY REAL** |
| Portfolio summary | `GET /api/v1/portfolio/summary` | **FULLY REAL** |
| Operational context | `buildManagerOperationalContext` | **FULLY REAL** |

---

## D. Service Boundaries

| Module | Owns Reads | Owns Writes |
|--------|-----------|-------------|
| `project.repository` | Yes | Yes (projects) |
| `project-summary.repository` | Yes | No |
| `ai-brain/services/*` | Yes (via repos/supabase) | No |
| `ai-brain/use-cases/*` | Yes | No |
| `copilot` | Yes (context building) | No (LLM calls only) |
| `document.service` | Yes | Yes |
| `milestone.service` | Yes | Yes |
| `cost.repository` | Yes | Yes |

---

## E. Architecture Constraints

| Constraint | Value |
|------------|-------|
| Canonical API surface | `/api/v1/*` |
| Auth/tenant | `getTenantContextFromRequest`, `requireTenant`, `getProject` for membership |
| Config/env | `lib/config/server`, `NEXT_PUBLIC_*`, `OPENAI_API_KEY` |
| Legacy zones | `/api/*` (non-v1) may exist; do not break |
| Validation approach | Zod (billing-readiness.contracts, plan-fit-api.schema) |
| Root lib vs apps/web/lib | Prefer `apps/web/lib/` extensions |

---

## Partial / Legacy / Unknown

| Item | Status | Notes |
|------|--------|-------|
| Approval-pressure summary | **PARTIAL** | No dedicated service; approval history exists |
| Document-pressure summary | **PARTIAL** | Document repository exists; no "pressure" aggregation |
| Budget-pressure summary | **PARTIAL** | cost-signals.service exists |
| Worker-facing AI assist | **PARTIAL** | Copilot exists; worker-specific mode TBD |
| Client-safe summary mode | **PARTIAL** | No explicit client-scoped output yet |
