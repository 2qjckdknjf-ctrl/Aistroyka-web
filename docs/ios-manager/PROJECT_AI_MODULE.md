# Per-Project AI Module (Phase 3)

**Date:** 2026-03-07  
**Scope:** Per-project AI entry and integration.

## Summary

- **Endpoint wired:** GET /api/v1/projects/:id/ai (ManagerAPI.projectAi(projectId:limit:offset:)). Backend already uses createClientFromRequest (Phase 2).
- **DTOs:** ProjectAIRowDTO (id, mediaId, status, createdAt); response data is analysis_jobs for project media.
- **Views:** ProjectAIView (project-scoped AI jobs list) reachable from ProjectDetailView "AI" quick link; loading/empty/error, pull-to-refresh. AITabView remains tenant-level GET /api/v1/ai/requests.
- **Navigation:** Project detail → AI → ProjectAIView. AI tab stays as global job list; project detail adds per-project entry.
- **No fake chatbot:** Only real data from backend; no synthetic chat UI.
