# AI Brain Phase A — Canonical Boundaries

**Status:** Complete  
**Date:** 2026-03-22

## Non-Negotiable Boundaries

1. **Auth/Tenant**  
   All AI Brain routes must use `getTenantContextFromRequest` + `requireTenant` and validate project membership via `getProject(supabase, ctx, projectId)`.

2. **Read-Only Tool Adapters**  
   Phase A tool adapters are read-only. No direct DB mutations, no bypass of existing service boundaries.

3. **Canonical API**  
   New AI Brain endpoints belong under `/api/v1/` and follow existing patterns (request ID, trace, audit).

4. **Service Ownership**  
   - Project truth: `project.repository`, `project-summary.repository`, `ai-brain/mappers`  
   - Health/risk/evidence: `ai-brain/services`  
   - Use-case aggregation: `ai-brain/use-cases`

5. **No Parallel Backend**  
   AI Brain assembles context from existing services. It does not own domain data or business rules.

6. **Config**  
   Use `lib/config/server`, `isOpenAIConfigured()`, existing env patterns. No new root config locations.

7. **Telemetry**  
   Use `logIntelligenceComplete`, `logIntelligenceError`, `emitAiRuntimeAudit`; no raw prompts or private data in logs.

8. **Output Contracts**  
   Extend or align with `intelligence-output.types.ts`; use Zod where new schemas are needed.

---

## Placement Rules

- **Additive module:** `apps/web/lib/ai-brain/phase-a/` — new foundation layer within existing ai-brain
- **No new parallel roots** — no `lib/ai-brain-v2` or competing structures
- **Reuse** — tool adapters call existing services; orchestrator composes them

---

## Mode Scope (Phase A)

| Mode | Required Context | Allowed Tools | Output Contract |
|------|------------------|---------------|-----------------|
| executive_summary | Project snapshot, health | All read adapters | ExecutiveProjectBrief |
| project_intelligence | Project snapshot | Health, risks, evidence | ManagerProjectInsight |
| manager_assist | Full snapshot | All read adapters | ManagerProjectInsight |
| worker_assist | Snapshot, tasks | Snapshot, activity, schedule | WorkerNextFocusSummary |
| client_safe_summary | Sanitized snapshot | Health, top-level only | ClientSafeProjectSummary |

---

## Degradation Rules

- If snapshot is null → return structured error, no partial output
- If a tool returns unavailable → include `availability: false` in result; do not invent data
- If data sufficiency is partial/insufficient → set `dataSufficiency` and `missingDataDisclaimer` in output
