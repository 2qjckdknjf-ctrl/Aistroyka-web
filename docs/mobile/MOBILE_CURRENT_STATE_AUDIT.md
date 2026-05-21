# Mobile current state audit

**Date:** 2026-05-19  
**Evidence:** Local `xcodebuild` Debug (iPhone 15 simulator), `./gradlew assembleDebug`, `curl` to production `/api/v1/health` (HTTP 200).  
**Code state:** After client-profile alignment (`ios_worker` / `android_worker`), Android Worker UI wiring, and tenant/parser fixes noted below.

---

## 1. App list

| App | Path |
|-----|------|
| iOS Worker | `ios/AiStroykaWorker` |
| iOS Manager | `ios/AiStroykaManager` |
| Android Worker | `android/AiStroykaWorker` |
| Android Manager | `android/AiStroykaManager` |
| Shared iOS | `ios/Shared` (local SPM) |
| Shared Android | `android/shared` |

---

## 2. Per-app matrix

### iOS Worker — **NOT READY** (product-complete on code paths; live E2E not executed in this session)

| Area | Status |
|------|--------|
| **Build** | **PASS** — `xcodebuild` Debug, scheme `AiStroykaWorker`, destination `iPhone 15`. |
| **Launch** | **PASS** (simulator; not re-run UI launch smoke in this pass after header change). |
| **Login** | **PASS** (code) — Supabase password grant via `AuthService`; tokens in Keychain. |
| **Backend** | **PASS** (code) — `WorkerAPI` → `/api/v1` worker, sync, media, devices, help, activation; `x-client: ios_worker` after this change set. |
| **Screen map** | Login, onboarding, home (projects, shift, tasks), task detail, report create (before/after photos, notes), resubmit, diagnostics, help/how-it-works, settings. |
| **API matrix** | `config`, `projects`, `worker/tasks/today`, `worker/day/start|end`, `worker/report/create|add-media|submit`, `media/upload-sessions`, `sync/bootstrap|changes|ack`, `devices/register|unregister`, `reports/:id`, `worker/sync`, `activation/status`, `help/hints|assistant|events`. |
| **Localization** | **PASS** — `en`, `ru`, `es`, `it` `Localizable.strings`; mission copy updated on `worker_onboard_p1_body` (ru/en). |
| **UI tests** | `AiStroykaWorkerUITests` present (smoke hooks / pilot IDs per project). |
| **Runtime risks** | Requires `Secrets.xcconfig` / merged plist for `BASE_URL`, `SUPABASE_*`; offline queue complexity; proof rules enforced in `OperationQueueExecutor`. |
| **P0 gaps** | **Live E2E** with pilot tenant not re-run here (no test account used in this session). **Release** signing / archive not verified. |

**Verdict sub-block:** **NOT READY** until stamped pilot E2E + release checks.

---

### iOS Manager — **NOT READY** (same: code strong, E2E not re-run here)

| Area | Status |
|------|--------|
| **Build** | **PASS** — `AiStroykaManager` Debug. |
| **Launch** | **PASS** (simulator; inferred from build). |
| **Login** | **PASS** (code). |
| **Backend** | **PASS** (code) — `ManagerAPI` uses full manager surface; `x-client: ios_manager` (not lite allow-list). |
| **Screen map** | Login, onboarding, tab shell, dashboard, projects, project detail, tasks, reports inbox, report detail + review (approve / reject / request changes + note), team, notifications, AI placeholders, settings, help. |
| **API matrix** | `me`, `projects`, `projects/:id`, `projects/:id/summary|ai`, `tasks`, `tasks/:id`, `reports`, `reports/:id` PATCH, `ops/overview`, `workers`, `devices`, `notifications`, `activation/status`, `help/*`, etc. |
| **Localization** | **PASS** — multi-locale; `mgr_onboard_p1_body` ru/en aligned to mission wording. |
| **Runtime risks** | Role/tenant from JWT + routes; must not expose internal finance on manager mobile (same as web RBAC). |
| **P0 gaps** | **Live review E2E** not executed in this session; **release** not verified. |

**Verdict sub-block:** **NOT READY** until stamped pilot E2E + release checks.

---

### Android Worker — **NOT READY**

| Area | Status |
|------|--------|
| **Build** | **PASS** — `:AiStroykaWorker:assembleDebug` (after Kotlin cache clean once; transient daemon/cache issue documented in artifacts). |
| **Launch** | **PASS** (inferred from compile; emulator not launched in this session). |
| **Login** | **FIXED in this session** — `WorkerApp` now uses `WorkerViewModel` (previously **only** a static guide card → **no product login**). |
| **Backend** | **PASS** (code) — `WorkerApi` parity extended with `worker/day/start|end`; `x-client: android_worker`. |
| **Screen map** | Login, first-run guide overlay, home (shift, projects, tasks, refresh, create report), report draft (before+after photo, note, submit). |
| **API matrix** | Same worker subset as iOS Worker (no persistent offline operation queue like iOS). |
| **Localization** | **PARTIAL** — `values`, `values-ru` extended for shift/photo/note; `es`/`it` fall back where keys missing. |
| **Runtime risks** | No durable offline queue; shift day id in `SharedPreferences` (process-clear loses in-memory only state safely); Gradle/Kotlin cache rare failures. |
| **P0 gaps** | **No resubmit / changes_requested** flow, **no sync bootstrap/ack UX**, **no manager-decision surface** like iOS home feedback section; **E2E not run**. |

**Verdict sub-block:** **NOT READY** vs iOS Worker parity and E2E proof.

---

### Android Manager — **NOT READY**

| Area | Status |
|------|--------|
| **Build** | **PASS** — `:AiStroykaManager:assembleDebug`. |
| **Launch** | **PASS** (inferred). |
| **Login** | **PASS** (code) — `ManagerApp` + `ManagerViewModel` wired. |
| **Backend** | **PASS** (code) — `ManagerApi`; **`android_manager` was previously not in `ClientProfile` / `parseClient` → fell back to `web`**; **fixed** in this session by extending `ClientProfile` + parser list. |
| **Screen map** | Login, guide, home with projects, reports list, report detail, review actions, media previews (Coil). |
| **API matrix** | Manager routes via non-lite client. |
| **Localization** | **PARTIAL** — mixed English/Russian across modules; not audited for zero English leakage in ru. |
| **P0 gaps** | **Full parity** vs iOS Manager tabs/placeholders not required by pilot but **E2E proof missing**; **resubmit cross-check** from Android Worker not implemented on Worker side. |

**Verdict sub-block:** **NOT READY** until E2E and localization audit.

---

## 3. Backend integration (canonical)

| Concern | Status |
|---------|--------|
| Health | `https://aistroyka.ai/api/v1/health` and `https://www.aistroyka.ai/api/v1/health` → **200** (unauthenticated smoke). |
| Lite allow-list | Extended to treat **`ios_worker` / `android_worker`** like legacy `*_lite` for path + idempotency rules. |
| Tenant `x-client` parsing | **`android_manager`**, **`ios_worker`**, **`android_worker`** added to `ClientProfile` allow-list so context matches real headers. |
| Idempotency | Unit tests updated for `ios_worker`. |
| Customer finance isolation | No change to customer surfaces; mobile uses worker/manager APIs only. |

---

## 4. Gap matrix (summary)

| Gap | Severity | Apps |
|-----|-----------|------|
| Pilot E2E not executed with credentials in this session | **P0** | All |
| Android Worker: no offline op queue / resubmit / sync UX | **P0/P1** | Android Worker |
| Android localization completeness | **P1** | Android |
| iOS / Android release signing & store checklists | **P1** | All |
| Android Manager duplicate-submit / background upload hardening | **P2** | Android Manager |

---

## 5. Hard verdict

| App | READY? | Blockers |
|-----|--------|----------|
| **iOS Worker** | **NOT READY** | Live E2E + release sign-off not done in this session. |
| **iOS Manager** | **NOT READY** | Same. |
| **Android Worker** | **NOT READY** | Parity gaps (resubmit/sync/offline) + E2E. |
| **Android Manager** | **NOT READY** | E2E + localization polish. |

---

## 6. Product code changed in this pass

- Edge/backend: `lite-allow-list.ts`, `lite-idempotency.ts`, `tenant.types.ts`, `tenant.context.ts`, `client-profile.ts`, tests, `events.service.ts` ClientProfile union.  
- iOS: `MobileClientProfile` → `ios_worker`, `APIClient` / `AppRuntime` / `RootView` / `DiagnosticsView`.  
- Android: `android_worker` profile; `WorkerApi` day endpoints; **Worker UI wired** to `WorkerViewModel`; before/after photos + shift + note; `build.gradle.kts` viewmodel-compose.  
- Copy: ru/en onboarding strings (Worker + Manager).
