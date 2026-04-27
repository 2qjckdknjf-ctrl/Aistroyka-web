# AI Brain Phase A — Consumption Path

**Status:** Phase A  
**Date:** 2026-03-22

## Route

`GET /api/v1/ai/project-brief?projectId=:id&mode=:mode`

- **Auth:** Tenant + project membership (getProject)
- **Query:**
  - `projectId` (required) — project UUID
  - `mode` (optional) — executive_summary | project_intelligence | manager_assist | worker_assist | client_safe_summary (default: executive_summary)
- **Response:** Orchestrator result with validated output contract

## Integration

- Extends canonical `/api/v1` surface
- Reuses getTenantContextFromRequest, requireTenant, getProject
- Uses addRequestIdToResponse, logIntelligenceComplete pattern
- No new UI — backend/internal/product consumption only
