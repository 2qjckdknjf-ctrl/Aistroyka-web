# iOS Manager — Final Executive Report

**Date:** 2026-03-07  
**Scope:** New primary iOS app "AiStroyka Manager" for manager/owner/admin/foreman, connected to the common engine.

---

## 1. Architecture chosen

- **Same Xcode project, additional target.**  
- **Project:** `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`  
- **New target:** AiStroyka Manager (product: AiStroyka Manager.app, bundle id: `ai.aistroyka.manager`)  
- **Shared code:** Via target membership (no separate framework). Core, Networking, AuthService from AiStroykaWorker folder are compiled into both Worker and Manager targets.

See **docs/ios-manager/REPORT-IOS-MANAGER-ARCHITECTURE-DECISION.md**.

---

## 2. Where the new app lives

- **Workspace:** Single-project workspace; open `AiStroykaWorker.xcodeproj`.  
- **Target:** AiStroyka Manager (native app target).  
- **Scheme:** AiStroyka Manager (auto-created).  
- **Source folder:** `ios/AiStroykaWorker/AiStroykaManager/` (entry, state, Services, Views, Info.plist, Assets).

---

## 3. Target / scheme setup

- **Product name:** AiStroyka Manager  
- **Bundle ID:** ai.aistroyka.manager  
- **Info.plist:** AiStroykaManager/Info.plist  
- **Config:** Same Secrets.xcconfig (BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY)  
- **Signing:** Automatic, same development team as Worker  

See **docs/ios-manager/XCODE_TARGET_SETUP.md**.

---

## 4. Shared core extracted / reused

- **Reused as-is (both targets):** APIError, Config, DeviceContext, KeychainHelper, NetworkMonitor, APIClient, Endpoints (ProjectDTO, TaskDTO, etc.), AuthService.  
- **Worker-only:** WorkerAPI, UploadManager, SyncService, persistence, Worker views.  
- **Manager-only:** AiStroykaManager app code, ManagerAPI, Manager views.  

See **docs/ios-manager/SHARED_CORE_EXTRACTION.md**.

---

## 5. Screens implemented

| Screen | Status |
|--------|--------|
| ManagerLoginView | ✅ Email/password sign-in |
| ManagerUnauthorizedView | ✅ Shown when role not allowed (logic placeholder) |
| ManagerTabShell | ✅ Tabs: Home, Projects, Tasks, Reports, Team, AI, More |
| HomeDashboardView | ✅ Skeleton (KPIs placeholder) |
| ProjectsListView | ✅ Real: GET /api/v1/projects, list + detail placeholder |
| ProjectDetailPlaceholderView | ✅ Placeholder (name, id) |
| TasksListPlaceholderView | ✅ Placeholder |
| ReportsInboxPlaceholderView | ✅ Placeholder |
| TeamOverviewPlaceholderView | ✅ Placeholder |
| AICopilotPlaceholderView | ✅ Placeholder |
| ManagerMoreView | ✅ Sign out, Settings, Notifications links |
| ManagerSettingsView | ✅ Shows API base URL |
| NotificationsPlaceholderView | ✅ Placeholder |

---

## 6. Integrations completed

- **Auth/session:** Shared AuthService; ManagerRootView sets token provider for APIClient.  
- **Projects:** ManagerAPI.projects() → GET /api/v1/projects; ProjectsListView loads and displays.  
- **Tasks/Reports API:** ManagerAPI.tasks(), ManagerAPI.reports() implemented; UI still placeholder.  
- **Config/tenant:** Same Config and BASE_URL; tenant from JWT (backend).  
- **Design / navigation:** Bootstrap, role gating (placeholder), tab shell, and reports documented.  

See **docs/ios-manager/MANAGER_ENGINE_INTEGRATION.md**, **MANAGER_BOOTSTRAP.md**, **MANAGER_NAVIGATION.md**, **MANAGER_DESIGN_SYSTEM.md**.

---

## 7. What is connected to the common engine

- **Auth:** Supabase Auth (REST), Keychain, shared AuthService.  
- **API base:** Config.apiBaseURL → /api/v1.  
- **Projects:** GET /api/v1/projects, ProjectDTO, ProjectsResponse.  
- **Tasks:** GET /api/v1/tasks, TaskDTO, TasksListResponse.  
- **Reports:** GET /api/v1/reports, ReportListItemDTO, ReportsListResponse.  
- **HTTP client:** APIClient (Bearer, x-device-id, x-client).  
- **Errors:** APIError; 401/403 handled in login and list.

---

## 8. What still needs backend work

- **Role:** Endpoint or tenant context returning role for Manager gating (owner/admin/member).  
- **x-client:** Optional backend rule for `ios_manager` vs `ios_lite`.  
- **Workers list:** GET /api/v1/workers implemented backend-side; ManagerAPI.workers() and Team UI to be wired.  
- **Ops/org metrics:** GET /api/v1/ops/overview, org/metrics/overview for dashboard KPIs.  
- **Report/task detail:** GET by id already exists; Manager detail screens to be wired.  
- **Notifications:** Backend semantics for manager notifications.

---

## 9. Exact next steps

1. **Role gating:** Use GET /api/v1/me or tenant context when available; restrict Manager to allowed roles.  
2. **x-client:** Set `ios_manager` for Manager target (compile flag or runtime).  
3. **Team tab:** Add ManagerAPI.workers(), DTO, and list view.  
4. **Dashboard:** Add ManagerAPI.opsOverview() / orgMetrics() and KPI cards.  
5. **Report detail:** Screen + GET /api/v1/reports/:id.  
6. **Task detail/create/edit:** Screens + GET/POST /api/v1/tasks, POST assign.  
7. **Design system:** Implement KPI card, empty/loading/error states, filter chips; refactor dashboard and lists.  
8. **AI tab:** GET /api/v1/projects/:id/ai and report analysis_status.

---

## 10. Reports created

- docs/ios-manager/REPORT-IOS-MANAGER-ARCHITECTURE-DECISION.md  
- docs/ios-manager/XCODE_TARGET_SETUP.md  
- docs/ios-manager/SHARED_CORE_EXTRACTION.md  
- docs/ios-manager/MANAGER_BOOTSTRAP.md  
- docs/ios-manager/MANAGER_NAVIGATION.md  
- docs/ios-manager/MANAGER_DESIGN_SYSTEM.md  
- docs/ios-manager/MANAGER_ENGINE_INTEGRATION.md  
- docs/ios-manager/CROSS_PLATFORM_CONSISTENCY.md  
- docs/ios-manager/IOS_MANAGER_BUILD_AND_QA_REPORT.md  
- docs/ios-manager/REPORT-IOS-MANAGER-FINAL.md  
