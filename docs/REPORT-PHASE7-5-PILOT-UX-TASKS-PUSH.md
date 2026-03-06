# Phase 7.5 — Pilot UX & Operator Loops (Tasks, Daily workflow, Push, Cockpit)

**Date:** 2026-03-06  
**Scope:** Today’s tasks, task–report linkage, push (APNS + device register), local reminders, cockpit visibility. Backend v1 additive only.

---

## 1. Summary

- **Stage 0:** Inventory: GET /api/v1/worker/tasks/today and POST /api/v1/devices/register exist; tasks API supports optional `project_id`. Done.
- **Stage 1:** Tasks API: optional `project_id` on today; tenant-scoped tests. Done.
- **Stage 2:** Worker Lite UI: TodayView (shift status, today’s tasks, pending ops/uploads), TaskDetailView (“Start report” → draftTaskId + ReportCreateView), ReportCreateView task title + clear draftTaskId on submit. All via operation queue. Done.
- **Stage 3:** Push: APNS token in AppDelegate, Keychain storage (never log/show), POST devices/register when token + auth; in-app handling for task_assigned/task_updated (refresh tasks), report_reminder/upload_failed. WorkerLite.entitlements (aps-environment). Done.
- **Stage 4:** Local reminders: LocalReminderService — submit by EOD (18:00) if draft + shift active; after-photo reminder 2h after before photo. Scheduled from AppStateStore.save. Done.
- **Stage 5:** Cockpit: ops/overview queue `workersOpenShiftNoReportToday` (open shift, no report submitted today); dashboard card + i18n. Done.
- **Stage 6:** This report + verification. Done.

---

## 2. Build & run

### Web
```bash
bun install --frozen-lockfile
cd apps/web && bun run test -- --run && bun run cf:build
```

### iOS
```bash
cd ios/WorkerLite
xcodebuild -scheme WorkerLite -destination 'generic/platform=iOS' build
```
**Push:** To receive remote notifications, enable **Push Notifications** for the App ID in Apple Developer and regenerate the provisioning profile. Without it, build may fail with “Provisioning profile doesn’t support Push Notifications”. To build without push: remove `WorkerLite.entitlements` from the target and remove `CODE_SIGN_ENTITLEMENTS` from the WorkerLite target build settings.

---

## 3. Daily worker scenario (checklist)

1. **Login** → Home (project selected).
2. **Shift:** Tap “Start shift” → queue start op; badge “Shift in progress”.
3. **Today’s tasks:** List loads from GET worker/tasks/today?project_id=…; tap task → TaskDetailView.
4. **Start report for task:** Tap “Start report” → draftTaskId set, navigate to ReportCreateView; title “Report for task: &lt;name&gt;”.
5. **Create report** → add before photo → add after photo → Submit → “Submitted”, draftTaskId cleared.
6. **End shift:** Tap “End shift” → queue end op.
7. **Pending uploads/ops:** If any, banner shows count; “Resume uploads” or queue runs on return.

---

## 4. Offline / background / kill (unchanged from 7.4)

- **Offline:** Create report, add photos, submit; ops queued; when online, executor runs and completes.
- **Background:** Uploads continue via BackgroundUploadService; completion handler in AppDelegate.
- **Kill during upload:** Relaunch; queue and task mapping restored; system can deliver URLSession completion.

---

## 5. Push (sandbox APNS)

1. Configure App ID with Push, create provisioning profile with Push.
2. Run on device (push not in Simulator for production flow).
3. Grant notification permission; token is stored in Keychain and sent to POST /api/v1/devices/register (never logged or shown in UI).
4. Backend: ensure device_tokens table and FCM/APNS sender (if used) are configured; send test payload with `type: "task_assigned"` or `"task_updated"` and optional `task_id`.
5. In-app: receiving push with type task_assigned/task_updated refreshes today’s tasks list.

---

## 6. Cockpit visibility

- **Who has active shift but no report today?** Dashboard → Ops overview → card “Open shift, no report today” (`queues.workersOpenShiftNoReportToday`).
- **Which tasks uncompleted?** Today’s tasks are per-worker via GET worker/tasks/today; cockpit can use existing reports/tasks data.
- **Which uploads failing?** Existing “Uploads stuck > 4h” and “Push failures” cards.

---

## 7. Gates

| Gate | Command | Note |
|------|--------|------|
| Web tests | `cd apps/web && bun run test -- --run` | 74 files, 335 tests |
| Web build | `bun run cf:build` | OpenNext Cloudflare |
| iOS build | `xcodebuild -scheme WorkerLite -destination 'generic/platform=iOS' build` | Requires Push-capable profile or entitlement removed |

---

## 8. Files changed (summary)

**Backend / Web**
- `apps/web/lib/domain/tasks/task.service.ts` — optional projectId filter for listTasksForToday.
- `apps/web/lib/domain/tasks/task.service.test.ts` — project_id filter test.
- `apps/web/lib/ops/ops-overview.repository.ts` — workersOpenShiftNoReportToday queue.
- `apps/web/app/[locale]/(dashboard)/dashboard/DashboardOpsOverviewClient.tsx` — card “Open shift, no report today”.
- `apps/web/messages/*.json` — queueOpenShiftNoReport.

**iOS**
- `AppStateStore.swift` — draftTaskId (CodingKeys, init, encode, decode, empty).
- `Endpoints.swift` — TaskDTO (camelCase), RegisterDeviceResponse.
- `WorkerAPI.swift` — tasksToday(projectId), registerDevice(pushToken).
- `PushRegistrationService.swift` — save/get token, registerIfNeeded().
- `WorkerLiteAppDelegate.swift` — push permission, token → register, handlePushPayload, Notification.Name.workerLitePushPayload.
- `WorkerLite.entitlements` — aps-environment.
- `TaskDetailView.swift` — task info, “Start report” → ReportCreateView(taskId, taskTitle).
- `HomeView.swift` — today tasks, loadTodayTasks(), push observer (refresh on task_assigned/task_updated).
- `ReportCreateView.swift` — taskId/taskTitle, “Report for task”, clear draftTaskId on submit.
- `RootView.swift` — registerIfNeeded on appear and onChange(isLoggedIn).
- `LocalReminderService.swift` — EOD submit reminder, 2h after-photo reminder; update(from:) called from AppStateStore.save.
- `KeychainHelper.swift` — pushTokenKey.
- `project.pbxproj` — TaskDetailView, PushRegistrationService, LocalReminderService, WorkerLite.entitlements, CODE_SIGN_ENTITLEMENTS.

---

## 9. Remaining / notes

- Backend report create still does not accept `task_id`; task–report link is client-only (draftTaskId).
- Push: server-side triggers (e.g. “report_reminder” at EOD) depend on existing push infra (Phase 4); this phase wires device registration and client handling.
- Local reminders use fixed 18:00 EOD and 2h after before photo; could be made configurable later.

---

## 10. Углублённый отчёт (Phase 7.5)

### Цель фазы
Сделать Worker Lite «ежедневно пригодным» для строителя: задачи на сегодня, один тап старт/конец смены, пошаговый отчёт «до/после» по задаче, напоминания по push и локально, видимость для руководителя в cockpit.

### Что сделано по стадиям

**Stage 0 — Инвентаризация**  
Подтверждено: GET /api/v1/worker/tasks/today и POST /api/v1/devices/register уже есть. Задачи фильтруются по tenant и (опционально) project_id. Отдельных ack/complete для задач не добавляли (по ТЗ опционально).

**Stage 1 — Минимальный Tasks API**  
API уже был; добавлена только опциональная фильтрация по `project_id` в `listTasksForToday` и в route. В `task.service.test.ts` добавлен тест на фильтр по project_id при сохранении tenant-scoping.

**Stage 2 — UI «сегодня» и привязка отчёта к задаче**  
- AppStateStore: поле `draftTaskId` (CodingKeys, init, decode, encode, empty()) для связи черновика отчёта с задачей.  
- TaskDTO: приведён к camelCase под keyDecodingStrategy (projectId, dueDate, createdAt, assignedTo).  
- HomeView: загрузка задач за сегодня через WorkerAPI.tasksToday(projectId), блок «Today's tasks» с NavigationLink в TaskDetailView; статус смены и pending ops/uploads без изменений; «New report» сбрасывает draftTaskId.  
- TaskDetailView: экран задачи (название, due, status), кнопка «Start report» — выставляет draftTaskId, открывает ReportCreateView с taskId/taskTitle.  
- ReportCreateView: опциональные taskId/taskTitle; заголовок «Report for task: …»; при успешном submit очищается draftTaskId.  
Все действия с отчётом по-прежнему идут через operation queue (Phase 7.4).

**Stage 3 — Push (APNS и регистрация устройства)**  
- WorkerAPI.registerDevice(pushToken): POST /api/v1/devices/register с device_id, platform: "ios", token.  
- Keychain: ключ для хранения APNS-токена; токен нигде не логируется и не показывается в UI.  
- PushRegistrationService: сохранение/чтение токена, registerIfNeeded() — вызов API при наличии токена и авторизации.  
- WorkerLiteAppDelegate: запрос разрешения и registerForRemoteNotifications в didFinishLaunching; в didRegisterForRemoteNotificationsWithDeviceToken — конвертация в hex-строку, сохранение, registerIfNeeded(); обработка didReceiveRemoteNotification — разбор type/task_id, постинг Notification.Name.workerLitePushPayload.  
- RootView: при появлении и при onChange(isLoggedIn) вызывается registerIfNeeded().  
- HomeView: подписка на .workerLitePushPayload; при type task_assigned/task_updated — перезагрузка списка задач.  
- WorkerLite.entitlements: aps-environment (development); для сборки с push нужен профиль с Push Notifications в App ID.

**Stage 4 — Локальные напоминания**  
LocalReminderService: при вызове update(from: state) отменяются старые напоминания и при необходимости создаются два: (1) «Submit report» — на 18:00 текущего дня, если смена начата и есть черновик отчёта; (2) «After photo» — через 2 часа после добавления «before»-фото, если «after» ещё нет. Вызов из AppStateStoreManager.save после каждого изменения состояния.

**Stage 5 — Связка с cockpit**  
ops-overview.repository: дополнительный запрос — user_id по worker_reports с submitted_at за сегодня; по ним из списка workersOpenShift отфильтрованы те, у кого нет отчёта за сегодня — очередь workersOpenShiftNoReportToday. DashboardOpsOverviewClient: новая карточка «Open shift, no report today» со ссылками на worker. Во все локали добавлен ключ queueOpenShiftNoReport.

**Stage 6 — Проверка и документ**  
Отчёт REPORT-PHASE7-5-PILOT-UX-TASKS-PUSH.md: шаги сборки/запуска, сценарий дня, офлайн/фон/kill, проверка push (sandbox APNS), что видит cockpit, таблица gates, список изменённых файлов. Gates: Web — bun run test и bun run cf:build — проходят. iOS — сборка с Push требует профиль с Push Notifications; без него можно временно убрать entitlements и CODE_SIGN_ENTITLEMENTS.

### Архитектурные решения
- Контракты backend v1 не ломаются: только опциональный query project_id и новая очередь в существующем GET /api/v1/ops/overview.  
- Связь задача–отчёт на клиенте (draftTaskId); бэкенд пока не принимает task_id в report create.  
- Push-токен только в Keychain, вызов register — только при наличии сессии (Auth).  
- Локальные напоминания не требуют сети и доп. API.

### Риски и ограничения
- iOS-сборка с включённым Push падает без соответствующего provisioning profile; в доке описаны оба варианта (включить Push в App ID или убрать entitlement для сборки без push).  
- Серверная отправка push (напоминания, task_assigned и т.д.) опирается на существующую инфраструктуру Phase 4; в 7.5 добавлены только регистрация устройства и обработка на клиенте.
