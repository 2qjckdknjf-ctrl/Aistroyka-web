# iOS Current State Audit (Phase 0)

**Project:** AISTROYKA  
**Scope:** AiStroykaWorker + AiStroykaManager (iOS only; Android out of scope)  
**Audit date:** 2026-05-19  
**Auditor role:** Principal iOS Product Engineer / Mobile Runtime Architect / QA Closure Lead  

This document is the **Phase 0** deliverable: repository inspection and **fresh Debug simulator builds** before claiming later-phase readiness. It establishes baselines for Phases 1–10 of the iOS product completion roadmap.

---

## 1. Xcode projects, schemes, targets

| App | Project path | Shared dependency | UITest target |
|-----|--------------|-------------------|---------------|
| Worker | `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` | Local Swift package `ios/Shared` | `AiStroykaWorkerUITests` |
| Manager | `ios/AiStroykaManager/AiStroykaManager.xcodeproj` | Local Swift package `ios/Shared` | `AiStroykaManagerUITests` |

**Schemes (discovered):** `AiStroykaWorker`, `AiStroykaManager` — each is the primary app scheme.

**Discover command:**

```bash
xcodebuild -list -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj
xcodebuild -list -project ios/AiStroykaManager/AiStroykaManager.xcodeproj
```

**Note:** There is **no** single workspace at `ios/` root; open each `.xcodeproj` separately.

---

## 2. Bundle IDs and signing

| App / target | `PRODUCT_BUNDLE_IDENTIFIER` | `DEVELOPMENT_TEAM` (effective) |
|--------------|-------------------------------|--------------------------------|
| Worker app | `ai.aistroyka.worker` | `43A4KW5BKB` (app target Debug/Release) |
| Worker UITests | `ai.aistroyka.worker.uitests` | `43A4KW5BKB` |
| Manager app | `ai.aistroyka.manager` | `43A4KW5BKB` (app target Debug/Release) |
| Manager UITests | `ai.aistroyka.manager.uitests` | `43A4KW5BKB` |

**Nuance:** **Project-level** Debug/Release configs list `DEVELOPMENT_TEAM = ""`; **app targets** override with `43A4KW5BKB`. Xcode resolves to the target value for normal builds.

**Worker entitlements:** `AiStroykaWorker.entitlements` (e.g. push) referenced from app target.

**Pilot risk:** Distribution still depends on valid provisioning profiles / Apple Developer membership on the active machine; Phase 10 must confirm TestFlight signing end-to-end.

---

## 3. Configuration: base URL, Supabase, runtime

- **Sources:** `Shared/Sources/Shared/Config.swift` — `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` via Info.plist / xcconfig merge, with env fallbacks; dangerous default `http://localhost:3000` if misconfigured.
- **Template:** `ios/Config/Secrets.xcconfig.example` → gitignored `Secrets.xcconfig`.
- **API root:** `apiBaseURL` = `{BASE_URL}/api/v1`.
- **Bootstrap:** `AppRuntime.configureSharedNetworkingForWorker()` / `ForManager()` set `x-client` on `APIClient` at launch (`RootView` / `ManagerRootView`).

---

## 4. App entry points

| App | Entry | Runtime hooks |
|-----|-------|----------------|
| Worker | `AiStroykaWorkerApp` → `RootView` | `AppDelegate` push, background uploads; onboarding gate via `AppStateStore` |
| Manager | `AiStroykaManagerApp` → `ManagerRootView` | `ManagerSessionState`, tab shell |

**Worker unauth flow:** Logged out → `WorkerOnboardingView` until intro complete → `LoginView`. Logged in → `HomeContainerView`.

---

## 5. Worker screen map (implemented)

| Area | Primary file(s) | Notes |
|------|-------------------|-------|
| Onboarding / first-run | `WorkerOnboardingView.swift` | Gated by `hasCompletedWorkerIntro` |
| Login | `LoginView.swift` | Pilot `accessibilityIdentifier`s |
| Project picker | `ProjectPickerView.swift` | Multi-project |
| Home / shift / tasks / sync | `HomeView.swift`, `HomeContainerView.swift` | Day start/end via operation queue; sync badge; “feedback” reports (`changes_requested`) → `ReportResubmitView` |
| Task detail | `TaskDetailView.swift` | Status + **Start report**; **no** linked report / resubmit surfacing here |
| Report create | `ReportCreateView.swift` | Before/after photos, **worker note** field, queued upload chain, submit |
| Resubmit | `ReportResubmitView.swift` | Manager note, optional reply note, queued resubmit |
| Diagnostics | `DiagnosticsView.swift` | Sheet |
| Settings | *Implicit* | Sign-out from home path; no full settings screen |

**Navigation:** `NavigationStack`, sheets, `navigationDestination` for reports.

---

## 6. Manager screen map (implemented)

| Area | Primary file(s) | Design system |
|------|-------------------|---------------|
| Login / unauthorized | `ManagerLoginView.swift`, `ManagerUnauthorizedView.swift` | — |
| Onboarding | `ManagerOnboardingView.swift` | First-run |
| Tab shell | `ManagerTabShell.swift` | Dashboard, Projects, Tasks, Reports, Team, AI, More |
| Dashboard | `HomeDashboardView.swift` | `ops/overview` |
| Projects | `ProjectsListView.swift`, `ProjectDetailView.swift` | — |
| Tasks | `TasksListView.swift`, task detail | Some `*PlaceholderView.swift` files remain in tree; shell should route to real views |
| Reports | `ReportsInboxView.swift` | Includes `ReportDetailReviewView` |
| More / settings / notifications | `ManagerMoreView.swift`, `ManagerSettingsView.swift`, `NotificationsView.swift` | — |

**Shared UI:** `LoadingStateView`, `EmptyStateView`, `ErrorStateView`, semantic colors.

---

## 7. API wiring matrix

### 7.1 Shared transport

| Concern | Implementation |
|---------|----------------|
| Client | `APIClient` (actor), JSON, Bearer via async token provider |
| Headers | `x-device-id` (`DeviceContext` / Keychain), `x-client`, optional `x-idempotency-key` |
| Errors | `APIError`; `SafeLog` for redaction (tokens must not hit logs) |
| 401 | `Notification.Name.apiClientDidReceiveUnauthorized` when profile is **`ios_manager`** or **`ios_lite`** (Worker + Manager); **Worker** `RootView` signs out on that notification for `ios_lite` |

### 7.2 Worker (`WorkerAPI` + `APIClient`)

| Capability | Path | Idempotency (lite) |
|------------|------|--------------------|
| Config | `GET config` | — |
| Projects | `GET projects` | — |
| Tasks today | `GET worker/tasks/today` | — |
| Task detail | `GET tasks/:id` | — |
| Day start / end | `POST worker/day/start`, `day/end` | Yes |
| Create report | `POST worker/report/create` | Yes |
| Add media | `POST worker/report/add-media` | Yes |
| Submit | `POST worker/report/submit` (+ `worker_note`) | Yes |
| Upload session | `POST media/upload-sessions`, finalize | Yes |
| Sync | `GET sync/bootstrap`, `GET sync/changes`, `POST sync/ack` | Ack: Yes |
| Devices | `POST devices/register`, `POST devices/unregister` | **Yes** (stable keys in `DeviceContext`) |
| Report detail | `GET reports/:id` (own) | — |
| Help / activation | `GET activation/status`, `POST help/*` | Partial idempotency N/A |

### 7.3 Manager (`ManagerAPI`)

Capabilities include: `GET me`, projects (+ summary, AI rows), tasks (+ assign), reports (+ `PATCH` review), `ops/overview`, workers, notifications, devices list, AI requests — see `ManagerAPI.swift` for full list.

### 7.4 `x-client` / lite policy (important)

- **Worker** uses **`ios_lite`** on purpose: must match Edge **lite allow-list** (`MobileClientProfile.liteWorker` documents this).
- **Manager** uses **`ios_manager`**.
- **Help API `role`:** `AppRuntime.helpHintsLaunchRoleForWorkerApp` is **`"manager"`** intentionally — comment in `AppRuntime.swift` states backend `LaunchRole` has no `worker` key; **this is not a stray bug**.

---

## 8. Auth and token storage

- **Auth:** Supabase REST password grant in `AuthService`.
- **Storage:** `KeychainHelper` (legacy **key namespace** still mentions `workerlite` in identifiers — cosmetic debt).
- **Logout:** Clears session Keychain; **Worker** also **`POST devices/unregister`** (best-effort) before sign-out (current repo).
- **Push:** `PushRegistrationService` + `WorkerAPI.registerDevice` / APNS in `AppDelegate`.

---

## 9. Localization and branding

- **Worker + Manager:** `en`, `ru`, `es`, `it` `Localizable.strings`.
- **Risk:** Residual **hard-coded English** in some Worker views (historical); Phase 2 / 9 should audit **RU-first** on critical paths.
- **Display names:** Info.plist product names “AiStroyka Worker / Manager”.

---

## 10. Accessibility & UI tests

| App | Coverage |
|-----|----------|
| Worker | Login: `pilot_worker_*`; report note / resubmit note; start report |
| Manager | Login: `pilot_manager_*`; report rows `pilot_manager_report_{id}`; review actions / note |
| XCTest | **Minimal** smoke only: login surface reachable (`WorkerSmokeUITests`, `ManagerSmokeUITests`) — **not** full field E2E |

---

## 11. Runtime / crash risks (static review)

1. **Memory:** Large base64 payloads in operation queue for photos — pressure on old devices.
2. **Force-unwrap paths:** Review `HomeContainerView` / navigation assumptions on regression.
3. **Camera:** `UIRequiredDeviceCapabilities` may include camera — understand App Store device matrix.
4. **Evidence URL:** Manager `AsyncImage` depends on **`file_url`** in `ReportMediaItem`; if API omits URL, UI shows ID fallback — **verify staging** response shape.

---

## 12. Build validation (this audit, 2026-05-19)

| Command | Log |
|---------|-----|
| `xcodebuild -project …/AiStroykaWorker.xcodeproj -scheme AiStroykaWorker -configuration Debug -destination 'generic/platform=iOS Simulator' build` | `artifacts/mobile-ios/worker-build.log` → **BUILD SUCCEEDED** |
| `xcodebuild -project …/AiStroykaManager.xcodeproj -scheme AiStroykaManager -configuration Debug -destination 'generic/platform=iOS Simulator' build` | `artifacts/mobile-ios/manager-build.log` → **BUILD SUCCEEDED** |

**Simulator manual E2E / real device / backend DB proof:** **Not** executed in this Phase 0 pass (see `artifacts/mobile-ios/*-smoke.md` checklists).

---

## 13. Missing flow matrix vs roadmap MVP

Legend: **Y** present, **P** partial, **N** missing / unproven  

### Worker

| Mission step | Status | Evidence / gap |
|--------------|--------|----------------|
| Login → projects → tasks | Y | Real APIs |
| Task detail | P | No report linkage / `changes_requested` surfacing |
| Day start/end | Y | Queued ops |
| Create report + photos + **notes** | Y | `worker_note` on submit |
| Submit + sync | P | Sync service; deep entity reconciliation not audited |
| Offline / retry | P | Operation queue persisted — **loss/edge cases** need Phase 3/6 proof |
| `changes_requested` → resubmit | P | `ReportResubmitView` + home list — **E2E not logged** |
| Dedicated settings | N | Logout only |

### Manager

| Mission step | Status | Evidence / gap |
|--------------|--------|----------------|
| Login + role gate | Y | `me` |
| Dashboard / projects / reports | Y | |
| Evidence gallery | P | **AsyncImage** when `file_url` set; else ID fallback |
| Approve | Y | Note optional for approve (by design in current UI) |
| Reject / request changes | Y | **Note required** (`submitReview` validation) |
| Intelligence / attention | P | Dashboard + APIs; matrix vs web in Phase 7 |

### Resubmit loop (Phase 5 scope)

| Item | Status |
|------|--------|
| Client UX | P | iOS Worker resubmit path exists |
| Backend contract | P | Assumed from web domain; **need logged E2E** Worker → Manager |

---

## 14. P0 / P1 / P2

### P0 (block “product-ready” honesty)

1. **No recorded end-to-end proof** (field report → storage → manager review → status change) on simulator + backend in CI/docs for this audit window.
2. **Manager evidence** effectiveness depends on **`file_url`** — must be verified on target environment.
3. **Worker task screen** does not expose report status / resubmit; users rely on **Home** — UX gap for closure loop discoverability.
4. **UITest coverage** stops at login chrome — roadmap §9 matrix unmet.
5. **Offline / bad network** — queue behavior not stress-validated (Phase 3/6).

### P1

- RU-first string audit on Worker hot paths.  
- Expand `accessibilityIdentifier`s for Phase 9 matrix.  
- Keychain / background identifier rename from `workerlite`.  
- Release build + signing checklist (lead-in to Phase 10).

### P2

- Documents / budget minimal surfaces (Phase 8).  
- Intelligence parity vs web (Phase 7).

---

## 15. Hard verdict: product-ready (mission §16)?

### **NO**

**Reason:** Codebase is **substantially closer** to MVP than a “foundation-only” stub: real APIs, idempotent lite writes, onboarding shells, manager review **with** reject + note rules, worker notes, resubmit UI, and evidence **when URLs exist**. However, **Phase 0 does not substitute for** logged E2E validation, storage/backend confirmation, device matrix, or TestFlight closure. **P0 items above** remain.

---

## 16. Phase 0 closure (required format)

### A. PHASE STATUS

**CLOSED** — audit refreshed; logs captured; no feature code required for Phase 0.

### B. WHAT WAS IMPLEMENTED

- Re-read Worker/Manager Swift surfaces, Shared networking, Manager approval UI, Worker resubmit/onboarding.
- Regenerated build logs for both apps (generic iOS Simulator destination).

### C. VALIDATION

| Check | Result |
|-------|--------|
| Build Worker Debug | **PASS** (`artifacts/mobile-ios/worker-build.log`) |
| Build Manager Debug | **PASS** (`artifacts/mobile-ios/manager-build.log`) |
| XCTest UI (full matrix) | **NOT RUN** (only minimal tests exist) |
| Simulator manual smoke | **Deferred** (`artifacts/mobile-ios/worker-smoke.md`, `manager-smoke.md`) |
| Real device | **Not run** |
| Backend evidence | **Not run** |

### D. REMAINING GAPS

- See §14 P0 — drives Phase 1 onward.

### E. FILES CHANGED

- `docs/mobile-ios/IOS_CURRENT_STATE_AUDIT.md` (this update)  
- `artifacts/mobile-ios/worker-build.log`, `manager-build.log`, `worker-smoke.md`, `manager-smoke.md`

### F. REPORTS CREATED / UPDATED

- `docs/mobile-ios/IOS_CURRENT_STATE_AUDIT.md`  
- `docs/mobile-ios/IOS_FINAL_MOBILE_READINESS_VERDICT.md` (global snapshot)  
- Artifact logs/checklists under `artifacts/mobile-ios/`

### G. NEXT PHASE ALLOWED

**YES** → **Phase 1 (iOS architecture stabilization)** per roadmap: tighten shared error/loading patterns, log hygiene audit, and any **proven** contract mismatches only.

---

*End of Phase 0 audit (2026-05-19).*
