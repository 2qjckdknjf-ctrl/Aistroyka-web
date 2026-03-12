# App Responsibility Matrix

**Date:** 2026-03-12  
**Project:** AISTROYKA

---

## AiStroykaManager

| Area | Responsibility |
|------|----------------|
| Dashboard | KPIs, ops overview, org metrics |
| Project overview | List projects, project detail, summary |
| Tasks management | List tasks, assign, create/edit, filter |
| Reports review | List reports, report detail, status |
| Team oversight | Workers list, worker detail, roles |
| AI insights | Project AI, report analysis, copilot |
| Notifications | Inbox, settings |
| Analytics | Usage, metrics (as exposed by API) |

**Clients:** Owners, admins, foremen. **x-client:** `ios_manager` / `android_manager`.

---

## AiStroykaWorker

| Area | Responsibility |
|------|----------------|
| Daily tasks | Today’s tasks, task detail, start/complete |
| Shift | Day start, day end |
| Reports creation | Create report, add media (before/after), submit |
| Photo before/after | Camera/gallery, link to report/upload session |
| Offline sync | Bootstrap, changes, ack; queue operations |
| Upload status | Upload queue, retry, finalize |
| Simple notifications | Push, in-app alerts for assigned work |

**Clients:** Field workers. **x-client:** `ios_lite` / `android_worker`.

---

## Separation rules

- **No** manager-only screens or APIs in the Worker app.
- **No** worker-only workflows (day start/end, report submit) in the Manager app.
- Shared: auth, config, device registration, and contract types (DTOs) implemented per platform in `ios/Shared` and `android/shared`.
