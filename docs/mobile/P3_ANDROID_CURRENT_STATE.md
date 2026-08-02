# P3 — Android Current State Inventory

**Date:** 2026-07-03  
**Phase:** P3 Android scope decision (Task A)  
**Evidence:** Repository inspection on `docs/development-os`; prior audits `docs/mobile/MOBILE_CURRENT_STATE_AUDIT.md`, `docs/mobile/MOBILE_FINAL_100_READINESS_VERDICT.md`, `docs/release-hardening/MOBILE_PILOT_READINESS.md`.

---

## 1. Android roots

| Root | Path | Role |
|------|------|------|
| Gradle root | `android/` | Multi-module project (`settings.gradle.kts`) |
| Shared library | `android/shared/` | API clients, auth, DTOs, session, push helpers |
| Manager app | `android/AiStroykaManager/` | Compose Manager shell |
| Worker app | `android/AiStroykaWorker/` | Compose Worker shell + FCM |
| Wrapper | `android/gradlew`, `android/gradle/wrapper/gradle-wrapper.properties` | Gradle **8.7** |
| Docs | `android/README.md` | Module overview |

---

## 2. Toolchain

| Item | Value | Source |
|------|-------|--------|
| AGP | 8.6.1 | `android/build.gradle.kts` |
| Kotlin | 1.9.20 | `android/build.gradle.kts` |
| JDK | 17 | subprojects `jvmTarget` |
| compileSdk / targetSdk | 35 | app `build.gradle.kts` files |
| minSdk | 26 | app modules |
| Compose BOM | 2023.10.01 | Worker/Manager deps |
| Firebase | BOM 33.7.0 (Worker FCM) | `AiStroykaWorker/build.gradle.kts` |

**Config resolution:** `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` via env → Gradle property → `local.properties` → BuildConfig defaults (`https://www.aistroyka.ai`).

**Release signing:** `android/keystore.properties` + gitignored keystore (optional; release builds unsigned locally without it).

**versionCode override:** `AISTROYKA_ANDROID_VERSION_CODE` env/Gradle property.

---

## 3. Manager app (`AiStroykaManager`)

### Modules / entry

| File | Purpose |
|------|---------|
| `MainActivity.kt` | Compose host |
| `ManagerApplication.kt` | `AppRuntime.init`, `SessionStore.init` |
| `ManagerViewModel.kt` | Auth, bootstrap, projects, reports, review |
| `ui/ManagerApp.kt` | Login, home, reports inbox, report detail + review |
| `ui/AiStroykaManagerTheme.kt`, `ManagerSemanticColors.kt` | Theming |
| `src/main/AndroidManifest.xml` | INTERNET; launcher activity |

### Auth

- Supabase password grant: `shared/AuthService.kt`
- Session: `shared/SessionStore.kt` (EncryptedSharedPreferences)
- API profile: `AppRuntime.apiClientProfile = android_manager` (set in ManagerApplication)

### API client

- `shared/ManagerApi.kt` — projects, reports, report detail, PATCH review, ops overview, media preview URLs
- `shared/ApiClient.kt` — Bearer, `x-device-id`, `x-client`, idempotency keys
- `shared/HelpApi.kt` — activation, hints, assistant (onboarding guidance)

### Screens (product contour)

| Screen | Status |
|--------|--------|
| Login | Implemented |
| First-launch guide | Implemented |
| Home (me, ops pending, project filter) | Implemented |
| Reports inbox | Implemented |
| Report detail + media preview (Coil) | Implemented |
| Approve / reject / request changes | Implemented (submitted only) |
| Full tab shell (tasks, team, AI, notifications) | **Not implemented** (iOS parity gap) |

### Tests

- `ManagerAppLaunchInstrumentedTest.kt` — activity + Compose root smoke
- CI: `.github/workflows/android-instrumented-smoke.yml` (Worker only; Manager not in workflow)

### Branding

- App label via `values/strings.xml`; helmet drawable `@drawable/aistroyka_helmet`
- Locales: `values`, `values-ru`, `values-es`, `values-it` (partial parity vs iOS)

---

## 4. Worker app (`AiStroykaWorker`)

### Modules / entry

| File | Purpose |
|------|---------|
| `MainActivity.kt` | Compose host |
| `WorkerApplication.kt` | Runtime init |
| `WorkerViewModel.kt` | Login, shift, tasks, report pipeline, sync, resubmit |
| `ui/WorkerApp.kt` | Login, home, report draft, resubmit |
| `WorkerFirebaseMessagingService.kt` | FCM receive |
| `src/main/AndroidManifest.xml` | INTERNET, CAMERA; FCM service |

### Auth / session

Same as Manager: `AuthService` + `SessionStore` (encrypted prefs).

Shift day id: `SharedPreferences` `aistroyka_worker_shift`.  
Sync cursor: `SharedPreferences` `aistroyka_worker_sync`.

### API client

- `shared/WorkerApi.kt` — config, projects, tasks, day start/end, report create/add-media/submit, upload sessions, Supabase storage upload, worker/sync, report detail, sync bootstrap/changes/ack
- Client header: `android_worker` (lite allow-list on Edge)

### Screens / flows

| Flow | Status |
|------|--------|
| Login | Implemented |
| First-launch guide | Implemented |
| Shift start/end | Implemented |
| Project + task selection | Implemented |
| Create report + photo pick (before/after) | Implemented |
| Upload session → storage → add-media → submit | Implemented in ViewModel |
| Manager feedback list (`worker/sync`) | Implemented |
| Resubmit (`changes_requested`) | Implemented |
| Manual sync (bootstrap/changes/ack) | Implemented (UI + ViewModel) |
| Task detail screen | API exists; **no dedicated UI** |
| Diagnostics / settings | **Not implemented** |
| Offline operation queue | **Not implemented** (unlike iOS `OperationQueueExecutor`) |

### Tests

- `WorkerAppLaunchInstrumentedTest.kt` — launch smoke only
- `shared/src/test/.../SubmitReportBodyTest.kt` — unit test for submit JSON helper
- `scripts/android/verify-worker-release-no-photo-bypass.sh` — release guard for photo bypass flag

### Branding

- Same helmet icon pattern; strings in `values`, `values-ru`, `values-es`, `values-it`

---

## 5. Shared library (`android/shared`)

| Module | Path | Notes |
|--------|------|-------|
| `ApiClient.kt` | HTTP v1 client | HTTP/1.1 forced for emulator reliability |
| `AuthService.kt` | Supabase sign-in/out | |
| `SessionStore.kt` | Encrypted session | Parity intent with iOS Keychain |
| `WorkerApi.kt` / `ManagerApi.kt` | Domain APIs | Broad route coverage |
| `WorkerDtos.kt` / `ManagerDtos.kt` | Serialization models | |
| `AppRuntime.kt` | Base URL, Supabase, client profile | |
| `DeviceContext.kt` | Device id + idempotency keys | |
| `PushRegistrationService.kt` | FCM register/unregister | Worker wired |
| `Config.kt`, `ApiError.kt`, `HelpApi.kt` | Support types | |

---

## 6. Build status

| Target | Last documented result | Notes |
|--------|------------------------|-------|
| `:AiStroykaWorker:assembleDebug` | **PASS** | Historical 2026-05-19; **reconfirmed Phase 6 2026-07-30** |
| `:AiStroykaManager:assembleDebug` | **PASS** | Same; **reconfirmed Phase 6 2026-07-30** |
| `:shared:test` | **PASS** | Phase 6: 10 unique unit tests, 0 failures |
| Release AAB/APK | **PARTIAL** | Local signing config may be PRESENT; Play upload NOT_AUTHORIZED |
| Play internal | **NOT_AUTHORIZED** | Deferred track; no Mode B upload in Phase 6 |
| CI instrumented smoke | Workflow exists | Emulator/device **NOT_IN_SCOPE** for deferred track |

**P3 validation:** No Gradle build executed in the original documentation-only P3 pass (Task F).  
**Phase 6 (2026-07-30):** Fresh required Gradle Debug + shared tests + lintDebug PASS — still **not** pilot/Play proof.

---

## 7. Product readiness classification

| Surface | Builds | Product-ready for first pilot | Classification |
|---------|--------|-------------------------------|----------------|
| Android Manager | Yes (debug/release scaffold) | **No** | **Foundation + partial contour** |
| Android Worker | Yes (debug/release scaffold) | **No** | **Foundation + partial contour** |

### What is real (not placeholder)

- Kotlin/Compose apps with working auth wiring
- API clients calling canonical `/api/v1` routes
- Manager review actions and Worker report pipeline in code
- FCM service stub on Worker
- Encrypted session storage
- Instrumented launch tests

### What remains placeholder / weak vs iOS Worker pilot flow

| Gap | Severity | iOS Worker reference |
|-----|----------|----------------------|
| No live E2E proof (login → report → photos → submit → manager decision) | **P0 for Android pilot** | iOS Layer B E2E script + UITest targets |
| No physical device smoke | **P0 for Android pilot** | TestFlight path documented |
| No durable offline operation queue / background retry | **P1** | `OperationQueueExecutor`, `BackgroundUploadService` |
| No task detail UI | **P2** | iOS task detail view |
| Manager missing tabs (tasks, team, AI, notifications) | **P2** (not first-pilot critical on web) | iOS Manager tabs |
| Release signing / Play upload owner gates | **P1** | Mode B gates in AGENTS.md |
| Stale docs still say "no Android in repo" | **Docs debt** | `PHASE6_*`, `DIAGNOSTICS_SURFACES.md` |

---

## 8. Risks

| Risk | If Android included in first pilot now |
|------|----------------------------------------|
| Shallow mobile proof | Code paths exist but unverified on device → demo failure |
| Timeline slip | MVP hardening + E2E + Play/device smoke adds weeks |
| Split support surface | Web/iOS runbook ready; Android adds untested failure modes |
| False parity claim | Manager/Worker Android thinner than iOS; client expectation mismatch |

| Risk | If Android deferred |
|------|---------------------|
| Android-only field workers excluded | Mitigate: web worker paths or issue iOS devices |
| Historical scope lock conflict | `docs/launch/FIRST_CLIENT_SCOPE_LOCK.md` (2026-03-24) listed Android mandatory — requires explicit owner/client reconfirmation |
| Catch-up debt | Future Worker MVP still needed if client standardizes on Android |

---

## 9. Exact file index (source of truth)

```
android/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle/wrapper/gradle-wrapper.properties
├── README.md
├── shared/src/main/java/ai/aistroyka/shared/
│   ├── ApiClient.kt
│   ├── AuthService.kt
│   ├── SessionStore.kt
│   ├── WorkerApi.kt
│   ├── ManagerApi.kt
│   ├── AppRuntime.kt
│   └── …
├── AiStroykaWorker/src/main/java/ai/aistroyka/worker/
│   ├── MainActivity.kt
│   ├── WorkerViewModel.kt
│   └── ui/WorkerApp.kt
└── AiStroykaManager/src/main/java/ai/aistroyka/manager/
    ├── MainActivity.kt
    ├── ManagerViewModel.kt
    └── ui/ManagerApp.kt
```

---

## 10. Task A verdict

| Question | Answer |
|----------|--------|
| Inventory complete | **FULL** (repo source + prior build audits; no fresh Gradle run in P3) |
| Android product-ready for first pilot | **NO** |
| Android buildable foundation | **YES** |
