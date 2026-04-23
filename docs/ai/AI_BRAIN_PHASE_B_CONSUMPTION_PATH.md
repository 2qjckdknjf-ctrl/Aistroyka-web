# AI Brain Phase B — Consumption Path

**Status:** Phase B  
**Date:** 2026-03-23

## Route

`POST /api/v1/ai/action-plan`

- **Auth:** Tenant + project membership (getProject)
- **Body:** `{ projectId: string, mode?: string, role?: string }`
- **Response:** `{ data: { drafts: AiActionDraft[], degraded?: boolean } }`
- **Behavior:** Draft-only. No execution. Returns planned action drafts.

## Safety

- No mutations
- No high-risk execution
- All actions remain proposal/draft
