# ADR-014: Project-level membership and task assignments

**Status:** Accepted  
**Decision:** Add project_members (tenant_id, project_id, user_id, role, status) and task_assignments (tenant_id, task_id, user_id, assigned_by, assigned_at) so worker/contractor access is project-scoped. Worker Lite endpoints expose only: tasks assigned via worker_tasks.assigned_to or task_assignments; own reports; own media/upload sessions. listTasksForUser considers both assignment sources; project_members is used for future project-scoped listing (e.g. filter projects for worker/contractor).

**Context:** Enterprise requirement that workers and contractors see only assigned work and own submissions, not full tenant data.

**Consequences:** Backward compatible: existing worker_tasks.assigned_to remains; task_assignments adds canonical assignment. Service-level enforcement in task.repository and task.service; reports/media already scoped by user_id.
