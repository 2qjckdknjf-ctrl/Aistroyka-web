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
| Dashboard | (future) | "Needs attention" items could link to task/report; not yet deep-linked |
| More | Notifications | NotificationsView (device list or empty state) |
| More | Settings | ManagerSettingsView |

## Unsupported / missing backend

- **Report detail → Approve/Review:** No backend write; shell only.
- **Notification → target screen:** No notification payload or inbox; no routing.
- **Dashboard overdue/reports → task or report:** Could add NavigationLink to task/report by id when backend includes id in ops/overview queues; currently display-only.

## Future deep-link opportunities

- Push notification payload with task_id or report_id → open TaskDetailManagerView or ReportDetailReviewView.
- Dashboard "Needs attention" rows as links to task/report when queue items include id.
- Universal links / URL scheme for web → Manager app handoff.
