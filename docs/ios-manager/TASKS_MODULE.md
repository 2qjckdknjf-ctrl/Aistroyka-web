# Tasks Module (Phase 2)

**Date:** 2026-03-07  
**Scope:** Real tasks list, detail, and create.

## Summary

- **Endpoints wired:** GET /api/v1/tasks (existing), GET /api/v1/tasks/:id (ManagerAPI.taskDetail(id:)), POST /api/v1/tasks (ManagerAPI.createTask(projectId:title:idempotencyKey:)).
- **Backend:** tasks route GET/POST and tasks/[id] GET/PATCH use createClientFromRequest(request) for Bearer auth.
- **DTOs:** TaskDetailDTO (id, title, status, projectId, dueDate, assignedTo, reportId, reportStatus), TaskDetailResponse.
- **Views:** TasksListView (list, project/status filter chips, toolbar "New", loading/empty/error, sheet TaskCreateEditView), TaskRowView, TaskDetailManagerView, TaskCreateEditView (form: project, title; Create/Cancel).
- **Tab:** ManagerTabShell uses TasksListView (replaces TasksListPlaceholderView). POST /api/v1/tasks/:id/assign is not yet wired in UI; document when adding assign flow.
