# Manager Navigation Shell

**Date:** 2026-03-07

---

## Top-level tabs

Implemented in **ManagerTabShell** (TabView, selection binding):

| Tab | Label | System image | Content |
|-----|--------|---------------|---------|
| Home | Home | house.fill | HomeDashboardView |
| Projects | Projects | folder.fill | ProjectsListView |
| Tasks | Tasks | checklist | TasksListPlaceholderView |
| Reports | Reports | doc.text.fill | ReportsInboxPlaceholderView |
| Team | Team | person.3.fill | TeamOverviewPlaceholderView |
| AI | AI | sparkles | AICopilotPlaceholderView |
| More | More | ellipsis.circle.fill | ManagerMoreView |

## Nested navigation

- Each tab content is wrapped in its own **NavigationStack** (in the view for that tab) so each tab has an independent stack.
- **ManagerMoreView:** List with sections Account (Sign out) and App (Settings, Notifications); NavigationLink to ManagerSettingsView and NotificationsPlaceholderView.
- Modal/sheet flows for create/edit/review can be added per tab (e.g. .sheet for task create, report review) without changing the shell.

## UX

- Enterprise-grade: list-based, clear labels, no worker-style shortcuts (e.g. no “start shift” on home).
- Ready for iPad: same TabView; layout can be extended later with split view or larger canvases.
