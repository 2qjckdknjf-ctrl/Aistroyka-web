# Empty / Edge State Hardening (Phase 5)

**Date:** 2026-03-07  
**Scope:** No dead screens; clear messaging and actions.

---

## Audited states

| State | Handling |
|-------|----------|
| No projects | ProjectsListView: EmptyStateView "No projects" + refreshable. |
| No tasks | TasksListView: EmptyStateView "No tasks" + refreshable; TaskDetailManagerView: "Task not found" when load fails. |
| No reports | ReportsInboxView: EmptyStateView "No reports"; ReportDetailReviewView: "Report not found" when load fails. |
| No notifications | NotificationsView: "No notifications yet. You'll see report and task updates here." + refreshable. |
| No workers | TaskAssigneePickerView: EmptyStateView "No workers" + retry via dismiss and re-open. |
| Load error | ErrorStateView with message + retry closure on list/detail screens. |
| Expired session | APIClient returns error; ManagerSessionState / root handles re-auth; ManagerUnauthorizedView when role/tenant missing. |
| Offline | No dedicated offline UI; failed requests show error message and retry. Optional: detect network and show banner. |

## Actions

- All list and detail screens have refreshable or retry. No dead screen without a way to retry or go back.
- Empty copy is actionable where relevant ("Field reports will appear here", "You'll see report and task updates here").
- Expired session: 401/403 surface as error; user can sign out and sign in again (More → Sign out).
