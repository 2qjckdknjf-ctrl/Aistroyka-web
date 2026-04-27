# AI Brain Phase A — Telemetry

**Status:** Phase A  
**Date:** 2026-03-22

## Captured Metadata (Safe)

| Field | Source | Notes |
|-------|--------|------|
| request_id | getOrCreateRequestId | X-Request-Id header |
| route | "GET /api/v1/ai/project-brief" | |
| mode | Query / run context | executive_summary, etc. |
| tenant_id | Tenant context | |
| project_id | Query | |
| user_id | Tenant context | |
| latency_ms | Date.now() diff | |
| output_type | "intelligence" | For logIntelligenceComplete |
| data_sufficiency | snapshot.dataSufficiencyFlags.snapshot | |
| health_score | get_project_health_summary.score | |
| insights_count | degradationFlags.length | |
| output_contract | result.output.type | ExecutiveProjectBrief, etc. |
| degradation_flags | result.degradationFlags | Tool unavailability |
| build_sha7, app_env | getAiReleaseCorrelation | |
| action | emitAiRuntimeAudit | ai_brain_project_brief_complete, ai_brain_orchestrator_error |

## Not Logged

- Raw prompts
- Raw private retrieved data
- Secrets
- Excessive user content

## Audit Events

- `ai_brain_project_brief_complete` — success
- `ai_brain_orchestrator_error` — failure
