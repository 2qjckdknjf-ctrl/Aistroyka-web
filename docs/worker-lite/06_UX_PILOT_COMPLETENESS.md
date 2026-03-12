# Worker Lite — UX Pilot Completeness

**Date:** 2025-03-11

## 1. Screen Audit

| Screen | Dead buttons | Placeholder text | Navigation | Empty | Error | Notes |
|--------|--------------|------------------|------------|-------|-------|-------|
| Login | No | No | N/A | N/A | errorMessage shown | Coherent. |
| HomeContainer | No | "Loading…", "No projects" | ProjectPicker or HomeView | "No projects" + Retry | errorMessage + Retry | Coherent. |
| Home (project) | No | Shift/task labels | TaskDetailView, ReportCreateView, Diagnostics, Sign out | Tasks list empty OK | errorMessage | Support → Diagnostics; Sign out. |
| Report create | No | "Create report", "Before/After photo", "Submit report" | Back via sheet/navigation | Draft id shown | errorMessage, submit states | Before/after required; submit when both attached. |
| Task detail | No | Task title/status | Report flow | N/A | Handled in report | Coherent. |
| Diagnostics | No | Version, env, device, session, sync | Done | N/A | lastError shown | Internal; coherent. |

## 2. Key Flows

- **Login:** Email/password, Sign In, loading + error state.
- **Home/today:** Project picker or single project; start/end shift; today tasks; New report; Support; Sign out.
- **Tasks:** List with NavigationLink to TaskDetailView.
- **Report creation:** Create report → before/after photo (camera or library) → Submit report; queued/submitted feedback.
- **Media attach/upload:** Via ReportCreateView; operation queue; pending count and "Resume queue" / "Resume uploads" on Home.
- **Settings/logout:** Sign out on Home; no separate settings screen (Diagnostics is support).

## 3. Minimal Pilot Polish

- Empty states and error states are present (loading, errorMessage, Retry, "No projects", sync status).
- No dead buttons identified. Placeholder strings are functional (not "Lorem").
- **Optional:** Add a single "Session expired" message when API returns 401 (see Phase 5). Otherwise no redesign; scope kept tight.

## 4. Verdict

- Key screens are coherent for pilot. No mandatory UX changes for pilot readiness; optional 401 messaging can be added later.
