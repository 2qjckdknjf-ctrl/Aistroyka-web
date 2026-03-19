# Step 13A — Task Attribution Closure

## 1. Current truth model

- **worker_tasks.assigned_to:** Single user ID; set when a task is assigned (legacy and current assign flow).
- **task_assignments:** (tenant_id, task_id, user_id, assigned_by, assigned_at). Canonical multi-assignment table; assign() in task-assignments.repository writes both task_assignments and worker_tasks.assigned_to.
- **Worker/contractor task visibility:** listTasksForUser() already merges both: tasks where assigned_to = user OR task_id in getAssignedTaskIds(). Manager list() previously only filtered by worker_tasks.assigned_to, so tasks assigned only via task_assignments (e.g. if assigned_to was not synced in some path) were missing when filtering by assignee.

## 2. What was fixed

- **task.repository list():** When `filters.assigned_to` is set:
  1. Call `getAssignedTaskIds(supabase, tenantId, filters.assigned_to)` to get task IDs from task_assignments.
  2. If `assignedIds.length > 0`, apply `.or(\`assigned_to.eq.${userId},id.in.(${assignedIds.join(",")})\`)` so that tasks matching either worker_tasks.assigned_to or task_assignments are returned.
  3. If `assignedIds.length === 0`, keep `.eq("assigned_to", assignedToUserId)` only.
- **Result:** Manager task list filtered by assignee (contractor/worker) now includes all tasks attributed to that user via either pathway. No duplicate rows (each task appears once). Pagination and other filters (project_id, from, to, status, q) apply unchanged.

## 3. Remaining limits

- **Count exact:** Supabase returns one row per task; .or() does not duplicate rows, so total count is correct.
- **Performance:** One extra read (getAssignedTaskIds) when assigned_to filter is used; small result set (task IDs per user). Acceptable.
- **No fake joins:** We do not join task_assignments in the main query; we use existing getAssignedTaskIds and combine via .or() in worker_tasks. Clean and consistent with listTasksForUser.
