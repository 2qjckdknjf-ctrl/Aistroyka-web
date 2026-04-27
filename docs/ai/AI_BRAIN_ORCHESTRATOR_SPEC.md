# AI Brain Orchestrator — Spec

**Status:** Phase A  
**Date:** 2026-03-22

## Purpose

Repo-native orchestration layer that:
- Receives a request
- Understands role/scope/mode
- Loads the right truth snapshot
- Decides which read-only tools are available
- Produces structured AI-ready context
- Returns typed outputs

Not a giant autonomous agent. Read-first, draft-first.

## Modes

| Mode | Required Context | Allowed Tools | Output Contract |
|------|------------------|---------------|-----------------|
| executive_summary | Project snapshot | All read adapters | ExecutiveProjectBrief |
| project_intelligence | Project snapshot | Health, risks, evidence, schedule | ManagerProjectInsight |
| manager_assist | Full snapshot | All read adapters | ManagerProjectInsight |
| worker_assist | Snapshot, tasks | Snapshot, activity, schedule | WorkerNextFocusSummary |
| client_safe_summary | Sanitized snapshot | Health, top-level only | ClientSafeProjectSummary |

## Run Context

```ts
interface AiBrainRunContext {
  requestId: string;
  mode: OrchestratorMode;
  tenantId: string;
  projectId: string;
  userId?: string;
  role?: "manager" | "worker" | "client" | "admin";
}
```

## Mode Registry

Each mode declares:
- requiredContext: string[]
- allowedTools: string[]
- outputContract: string
- degradationRules: DegradationRule[]

## Degradation Rules

- If snapshot is null → return error, no partial output
- If tool unavailable → set availability flag in result
- If dataSufficiency partial/insufficient → set flags in output

## Location

`apps/web/lib/ai-brain/phase-a/orchestrator/`
