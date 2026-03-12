# Notification Deep Links (Phase 5)

**Date:** 2026-03-07  
**Scope:** Deep navigation when tapping a notification in Manager More → Notifications.

---

## Implemented

- **Coordinator:** `ManagerMoreDestination` enum (settings, notifications, task(id), report(id), project(id)) drives `NavigationStack(path:)` in `ManagerMoreView`. Notifications screen receives `onOpenTarget: (targetType, targetId) -> Void`; More tab provides a closure that maps type/id to enum and appends to path.
- **target_type → destination:**
  - `task` → `TaskDetailManagerView(taskId:)`
  - `report` → `ReportDetailReviewView(reportId:)`
  - `project` → `ProjectDetailView(projectId:projectName:)` (projectName nil)
- **Safe fallback:** Task/report/project detail views already handle load failure (ErrorStateView / "Not found"); no extra handling required.
- **Tab state:** Navigation occurs inside the More tab’s stack; tab selection is unchanged; back returns to Notifications then to More root.

## Usage

- User opens More → Notifications → taps a notification with `target_type` and `target_id`. Notification is marked read; stack pushes the corresponding detail view. Back button returns to inbox.

## Out of scope

- Push notification payload → open app to task/report (would require URL scheme or universal link and same path-based handling).
- Target types other than task, report, project (ignored by coordinator).
