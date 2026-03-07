# AI Tab — First Real Integration (Phase 2)

**Date:** 2026-03-07  
**Scope:** AI tab wired to GET /api/v1/ai/requests.

## Summary

- **Endpoint wired:** GET /api/v1/ai/requests (ManagerAPI.aiRequests(limit:offset:status:)).
- **Backend:** ai/requests route uses createClientFromRequest(request) for Bearer auth.
- **DTOs:** AIJobDTO (id, type, status, entity, attempts, lastError, createdAt, updatedAt), AIRequestsResponse.
- **Views:** AITabView (list of AI jobs, loading/empty/error, pull-to-refresh), AIJobRowView (type, status, entity, lastError).
- **Tab:** ManagerTabShell uses AITabView (replaces AICopilotPlaceholderView).
- **Safe fallback:** No fake chat; when no jobs, shows EmptyStateView. No GET /api/v1/projects/:id/ai in UI yet; can be added for per-project AI list.
