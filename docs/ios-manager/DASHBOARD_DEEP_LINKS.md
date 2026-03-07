# Dashboard Deep Links (Phase 4)

**Date:** 2026-03-07  
**Scope:** Navigation from dashboard "Needs attention" to task/report detail.

---

## Implemented

- **Overdue tasks** — Each overdue task in the dashboard queue is a `NavigationLink` to `TaskDetailManagerView(taskId:)`. Safe fallback: if task was deleted, detail view shows error/not found.
- **Due today** — Open tasks due today link to `TaskDetailManagerView(taskId:)`.
- **Reports pending review** — Each pending report links to `ReportDetailReviewView(reportId:)`. Same fallback if report no longer exists.

## Navigation architecture

- Dashboard lives in a `NavigationStack`; links push task/report detail onto the stack.
- No shared coordinator; each destination is a direct NavigationLink. Future deep-link (e.g. push notification → task) can use the same destination types with taskId/reportId.

## Unsupported / future

- **Project from dashboard** — Overview does not currently surface "attention" by project; project detail is reached via Projects list.
- **AI issue context** — No dashboard block for "AI failed" linking to AI tab or job detail yet; can be added when UI exists.
