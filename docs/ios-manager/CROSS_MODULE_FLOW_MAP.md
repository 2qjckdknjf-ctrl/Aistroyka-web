# Cross-Module Navigation and Deep Flow (Phase 3)

**Date:** 2026-03-07  
**Scope:** Supported navigation chains and gaps.

## Supported navigation chains

| From | To | How |
|------|-----|-----|
| Projects list | Project detail | Tap project → ProjectDetailView |
| Project detail | Tasks (project) | Quick link → TasksListForProjectView |
| Project detail | Reports (project) | Quick link → ReportsInboxForProjectView |
| Project detail | AI (project) | Quick link → ProjectAIView |
| Tasks list | Task detail | Tap task → TaskDetailManagerView |
| Task detail | Assign | "Assign to worker" → TaskAssigneePickerView (sheet) |
| Reports list | Report detail | Tap report → ReportDetailReviewView |
| Dashboard | Task detail | Overdue / due today → TaskDetailManagerView |
| Dashboard | Report detail | Reports pending review → ReportDetailReviewView |
| More | Notifications | NotificationsView (inbox list; devices in disclosure) |
| More | Settings | ManagerSettingsView |

## Unsupported / future

- **Notification tap → target screen:** Inbox has target_type/target_id; iOS marks read on tap; programmatic navigation to task/report from notification row not yet wired (would require coordinator or environment).
- **Universal links / URL scheme** for web → Manager app handoff.

## Phase 4 updates

- Report detail → Approve / Mark reviewed / Request changes: PATCH /api/v1/reports/:id wired; Manager shows real actions and refreshed state.
- Notifications: GET /api/v1/notifications inbox; PATCH :id/read; Manager shows inbox list and devices in disclosure.
- Dashboard overdue, due today, reports pending → NavigationLink to TaskDetailManagerView or ReportDetailReviewView.
