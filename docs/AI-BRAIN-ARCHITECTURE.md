# AI Brain Architecture

## Overview

The AI Construction Brain is an **interpretation layer** over existing data (projects, reports, tasks, media). It does not replace the current domain; it adds structured signals and services for health, risk, evidence, and recommendations.

## What Was Created

- **`lib/ai-brain/domain/`** — Signal types: `ProjectSnapshot`, `ProjectHealth`, `TaskSignal`, `ReportSignal`, `EvidenceSignal`, `RiskSignal`, `ManagerInsight`, `ExecutiveSummary`, `ActionRecommendation`, `AlertEvent`, etc. No Supabase dependency.
- **`lib/ai-brain/mappers/`** — Build domain from existing repos: `buildProjectSnapshot`, `getTaskSignals`. Use `project-summary.repository`, `project.repository`, `worker_tasks`, `media`, `analysis_jobs`, `worker_day`, `worker_reports`.
- **`lib/ai-brain/services/`** — Pure and async services:
  - `project-health.service`: `computeProjectHealth(snapshot)` → health score, label, blockers, missingData, delayIndicators.
  - `report-intelligence.service`: `getReportSignals(supabase, projectId, tenantId)` → report coverage/missing/draft.
  - `evidence-intelligence.service`: `getEvidenceSignals(...)` → missing/partial evidence.
  - `risk-intelligence.service`: `aggregateRiskSignals(inputs)`, `getRiskOverview(signals)`.
  - `executive-summary.service`: `buildExecutiveSummary(inputs)`.
  - `recommendation-engine.service`: `getActionRecommendations(inputs)`.
- **`lib/ai-brain/use-cases/`** — Product-facing: `getManagerInsights`, `getExecutiveSummaryForProject`, `getRiskOverviewForProject`, `getEvidenceCoverageForProject`, `getReportingDisciplineForProject`, `getActionRecommendationsForProject`.
- **`lib/ai-brain/types.ts`** — `ILLMAdapter`, `CopilotContext`, `CopilotLLMResult` for future LLM integration.
- **`lib/ai-brain/config.ts`** — `getLLMProviderConfig()`, `isCopilotLlmAvailable()`; uses existing `lib/config` (e.g. OpenAI).

## What Is Real vs Scaffold

- **Real:** Domain types, mappers that read from existing tables, health/report/evidence/risk/executive-summary/recommendation services, use-case functions that call these services.
- **Scaffold:** Per-task evidence count (schema may not link media to task); portfolio-level executive summary (single-project only so far). LLM integration is behind `ILLMAdapter`; Copilot uses deterministic fallback when no adapter is provided.

## How to Extend

1. Add new signal types in `domain/signals.types.ts` and re-export from `domain/index.ts`.
2. Add mappers that fill them from Supabase/repos.
3. Add or extend services that aggregate signals and compute insights.
4. Wire a real `ILLMAdapter` in Copilot when the AI backend is ready.
