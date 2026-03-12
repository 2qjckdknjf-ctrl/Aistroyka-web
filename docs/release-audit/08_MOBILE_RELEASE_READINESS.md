# Release Audit — Phase 8: Mobile App Release Readiness

**Generated:** Release Readiness Audit

---

## 1. iOS Manager App (AiStroykaWorker)

| Aspect | Status | Evidence | Release blockers | Next actions |
|--------|--------|----------|------------------|--------------|
| Structure | READY | AiStroykaWorker.xcodeproj, AiStroykaManager, Views, Services, Networking | — | — |
| Auth/session | READY_WITH_RISK | Supabase Auth; session persistence | None | Validate token refresh and re-auth flow in prod |
| API alignment | READY | Uses v1; x-client ios_manager (or equivalent) | — | Confirm lite-allow-list does not block manager paths (manager not in LITE_CLIENTS) |
| Task/report flows | READY | API contract supports worker/tasks/today, worker/report/* | — | E2E on device |
| Naming/bundle | READY_WITH_RISK | AiStroykaWorker naming; bundle ID in project | None | Confirm App Store naming |
| Production build | UNKNOWN | Not built in audit | — | Archive and validate on device |
| Crash risks | UNKNOWN | No crash reporting audited in code | — | Add crash reporting for pilot |

---

## 2. Worker Lite iOS (WorkerLite → AiStroykaWorker)

| Aspect | Status | Evidence | Release blockers | Next actions |
|--------|--------|----------|------------------|--------------|
| Rename state | PARTIAL | Git: many deleted WorkerLite files; new AiStroykaWorkerApp, entitlements, tests | **Blocker:** Rename incomplete; mixed references | Complete rename; remove dead code; single app target |
| Auth | READY_WITH_RISK | Bearer/session; x-client ios_lite | — | Align with allow-list |
| Sync/upload | READY | v1/sync, upload-sessions in allow-list | — | — |
| Task/report | READY | worker/tasks/today, report create/add-media/submit | — | — |
| Offline | UNKNOWN | No offline queue verified | Medium | Document expectations; add offline queue if required |
| Push | PARTIAL | Register/unregister devices; CONFIG-DEPENDENT | — | Configure APNS |
| Production build | BLOCKED | Rename in progress | **Blocker** | Finish rename; then build |

---

## 3. Android

| Aspect | Status | Evidence | Release blockers | Next actions |
|--------|--------|----------|------------------|--------------|
| Codebase | NOT_PRESENT | No android/ in repo | — | N/A or separate repo |
| API | READY | android_lite in lite-allow-list | — | When client exists, use same contract |

---

## 4. Shared API Contract Compatibility

- **Lite allow-list:** config, worker/*, sync/*, media/upload-sessions*, devices*, reports/[id]/analysis-status. Matches worker and upload flows.
- **Manager:** Not restricted by allow-list (only ios_lite/android_lite); manager can call full v1.
- **Compatibility:** No breaking mismatch identified; versioned v1 API.

---

## 5. Summary Tables

**By app**

| App | Status | Evidence | Release blockers | Recommended next actions |
|-----|--------|----------|------------------|--------------------------|
| iOS Manager | READY_WITH_RISK | Full structure; API aligned | None | Prod auth validation; crash reporting |
| iOS Worker Lite | PARTIAL | Rename in progress; deleted files | Rename incomplete; build unclear | Complete rename; smoke test; APNS config |
| Android | NOT_IMPLEMENTED | No app in repo | N/A | — |

**Release blockers (mobile)**

1. **Worker Lite:** Complete iOS WorkerLite → AiStroykaWorker rename and stabilize build before pilot.
2. **Push:** APNS/FCM configuration for production if push is required for pilot.
3. **Crash visibility:** Recommend adding crash reporting (e.g. Sentry) for manager and lite before wide pilot.
