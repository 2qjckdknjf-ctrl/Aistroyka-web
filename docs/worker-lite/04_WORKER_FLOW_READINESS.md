# Worker Lite — Worker Flow Readiness

**Date:** 2025-03-11

## A. Auth

| Flow | Status | Notes |
|------|--------|------|
| Login | ✅ | LoginView: email/password → AuthService.signIn; token + user id stored in Keychain. |
| Logout | ✅ | appState.logout() → AuthService.signOut(); Keychain cleared; isLoggedIn = false. |
| Session restore on reopen | ✅ | RootView.onAppear calls appState.checkSession(); Keychain read in AuthService.currentSession(). |
| Token expiry / re-auth | ⚠️ | No explicit refresh flow. API 401 would surface as error; user must re-login. Acceptable for pilot. |

## B. Work Day

| Flow | Status | Notes |
|------|--------|------|
| Start day | ✅ | HomeView "Start shift" → QueuedOperation .startShift → WorkerAPI.startDay(idempotencyKey:). |
| End day | ✅ | "End shift" → .endShift → WorkerAPI.endDay(idempotencyKey:). |
| Today status | ✅ | store.state.shift.isStarted, store.state.shift.dayId; todayDayId() used for keys. |
| Worker identity / tenant | ✅ | Auth session (user id) + selected project (AppStateStore selectedProjectId); WorkerAPI uses APIClient with Bearer token. |

## C. Tasks

| Flow | Status | Notes |
|------|--------|------|
| Fetch today tasks | ✅ | WorkerAPI.tasksToday(projectId:) → worker/tasks/today; loadTodayTasks() in HomeView. |
| List and detail | ✅ | HomeView lists todayTasks; NavigationLink to TaskDetailView(task, projectId, dayId). |
| Progress/status updates | ✅ | TaskDTO.status shown; TaskDetailView can show task and link to report. |
| Empty/error/loading | ✅ | tasksLoading + todayTasks.isEmpty → ProgressView; errorMessage shown; empty list just no rows. |

## D. Reports

| Flow | Status | Notes |
|------|--------|------|
| Create report | ✅ | ReportCreateView; enqueueCreateReport() → worker/report/create with idempotency. |
| Attach to task/day/project | ✅ | dayId, taskId passed; WorkerAPI.createReport(dayId, taskId, idempotencyKey). |
| Submit report | ✅ | enqueueSubmitReport() → worker/report/submit; submit enqueued/submitted states. |
| Analysis status | ⚠️ | Backend allow-list has reports/:id/analysis-status; iOS not audited for this screen. Pilot can use web if needed. |

## E. Media

| Flow | Status | Notes |
|------|--------|------|
| Photo capture/import | ✅ | ReportCreateView: CameraPicker + ImagePicker; before/after; confirmationDialog for source. |
| Upload session lifecycle | ✅ | createUploadSession(purpose:, idempotencyKey:) → upload_path; upload to storage then add-media. |
| Upload finalize | ✅ | Operation queue: create report → upload session → upload file → add-media → submit. |
| Retry/error | ✅ | OperationQueueStore + OperationQueueExecutor; pending count, "Resume queue", lastError. |
| Multiple attachments | ✅ | Before + after photos; add-media per photo; attachMediaOpId(photoItemId:). |

## F. Sync

| Flow | Status | Notes |
|------|--------|------|
| Bootstrap | ✅ | SyncService: sync/bootstrap; SyncConflictError.mustBootstrap → runBootstrap then retry. |
| Changes | ✅ | sync/changes with cursor; 409 → parse SyncConflictBody, mustBootstrap. |
| Ack | ✅ | sync/ack. |
| Recovery after reconnect | ✅ | NetworkMonitor; syncService.runSyncIfOnline() on HomeView.onAppear when idle/offline. |
| Offline expectations | ✅ | Sync status: idle, synced, syncing, needsBootstrap, offline, error; UI shows status label. |

## G. Devices / Push

| Flow | Status | Notes |
|------|--------|------|
| Register device | ✅ | WorkerAPI.registerDevice(pushToken:); PushRegistrationService.registerIfNeeded() after login. |
| Unregister | ⚠️ | No explicit unregister on logout; backend may retain token. Optional pilot improvement. |
| Config prerequisites | ✅ | APNS token stored in Keychain; registerIfNeeded() only when token + auth. |
| Graceful when push not configured | ✅ | registerIfNeeded() no-ops if no token; no crash. Entitlements currently empty; add Push Notifications when enabling. |

## API Alignment Summary

- **x-client:** ios_lite (APIClient.clientProfile) — matches lite-allow-list.
- **Paths used:** config, projects, worker/tasks/today, worker/day/start|end, worker/report/create|add-media|submit, media/upload-sessions, sync/bootstrap|changes|ack, devices/register — all allowed for ios_lite.
- **Idempotency:** x-idempotency-key sent for write endpoints; backend lite-idempotency accepts ios_lite.
