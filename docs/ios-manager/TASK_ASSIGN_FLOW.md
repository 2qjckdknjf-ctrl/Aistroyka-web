# Task Assign Flow (Phase 3)

**Date:** 2026-03-07  
**Scope:** Manager-side task assignment.

## Summary

- **Endpoint wired:** POST /api/v1/tasks/:id/assign (body: worker_id). Backend uses createClientFromRequest(request).
- **Assignee source:** GET /api/v1/workers — list used as assignee directory (user_id = worker_id).
- **UI:** TaskDetailManagerView has "Assign" section; "Assign to worker" opens TaskAssigneePickerView sheet; picker lists workers from ManagerAPI.workers(); tap selects and calls ManagerAPI.assignTask(taskId:workerId:idempotencyKey:); task detail refreshes after success; assign error shown inline.
- **States:** Loading picker, empty workers, error, assigning, success (refresh). No optimistic update; refresh after assign.
