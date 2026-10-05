# D1 — Android vs supported iOS flows (audit only)

Observed 2026-10-05 against `origin/main` `cc40ccee`. Code inventory only. No Android product implementation in this slice. No store, emulator, or device claim.

Policy: iOS is the primary mobile contour. Manager and Worker stay separate apps. Android first-pilot is deferred. D2 (implement critical gaps) is **not** started.

## What Android already has

| Surface | Present on main | Notes |
|---|---|---|
| `android/AiStroykaManager` | yes | Compose scaffold: login, home/ops overview, reports list, report review |
| `android/AiStroykaWorker` | yes | Compose scaffold: login, shift start/end, tasks today, report photo + submit, resubmit, FCM |
| `android/shared` | yes | `ApiClient`, `AuthService` (email/password), `ManagerApi`, `WorkerApi`, sync bootstrap/changes/ack, upload session |
| Pilot tags | yes | `pilot_manager_*` and `pilot_worker_*` plus instrumented login-tag tests |
| Lite client | yes | Worker uses `android_lite` Edge allow-list (same class as `ios_lite`) |

## Manager: supported iOS vs Android

iOS Manager (`ios/AiStroykaManager`, `ManagerAPI.swift`) is the supported contractor-ops client. Android `ManagerApi.kt` is a thin subset.

| Flow | iOS | Android | Gap class |
|---|---|---|---|
| Email/password login | yes | yes | smoke-tag parity |
| Reports inbox + review | yes | yes (list/detail/approve) | thinner UI |
| Ops overview | yes | yes | thinner UI |
| Projects list | yes | yes | thinner UI |
| Create project / invite teammate | yes | no | not on Android API |
| Tasks create/assign/patch | yes | no (`taskDetail` only) | not on Android API |
| Documents hub / decide document | yes | no | not on Android API |
| Team / members / invitations | yes | no | not on Android API |
| Notifications inbox | yes | no | not on Android API |
| Copilot SSE / project intelligence | yes | no | not on Android API |
| Construction graph / AI jobs | yes | no | not on Android API |
| Issues, estimates, workload, devices | yes | no | not on Android API |
| Sign in with Apple / Google | yes | no (email only) | not on Android auth |

These gaps are **expected under iOS-primary**. They are not D2 work unless an owner later names a critical Android-only blocker.

## Worker: supported iOS vs Android

iOS Worker (`WorkerAPI.swift`, `WorkerV43API.swift`, camera/offline/task chat) is the supported field client. Android Worker covers a daily report loop.

| Flow | iOS | Android | Gap class |
|---|---|---|---|
| Email/password login | yes | yes | smoke-tag parity |
| Config / projects / tasks today | yes | yes | |
| Start/end day | yes | yes | |
| Create report, photo upload, submit | yes | yes | |
| Sync bootstrap/changes/ack | yes | yes | |
| FCM register | yes | yes | |
| QR / invite join | yes | no | not on Android |
| Issues create/patch | yes | no | not on Android API |
| Documents / drawings pin | yes | no | not on Android |
| Task chat | yes | no | not on Android |
| Native camera evidence / V4.3 shell | yes | picker-only Compose | expected thinner |
| Offline queue / reminders | yes | limited in-process pipeline | expected thinner |
| Sign in with Apple / Google / phone OTP | yes (OTP gated) | no | not on Android auth |

## Tests observed in source (not executed here)

- Android: `WorkerAppLaunchInstrumentedTest`, `ManagerAppLaunchInstrumentedTest`, `SubmitReportBodyTest`
- iOS: UITest targets `WorkerSmokeUITests` / `ManagerSmokeUITests` (C0); not Android scope

## Verdict

- **D1 complete as audit:** Android is a thinner Compose + shared-API scaffold of a subset of iOS Manager/Worker flows. Login smoke tags exist. Full iOS surface is not present and must not be treated as missing-by-accident.
- **D2:** do not implement Android gap fill from this document.
- **First-pilot Android:** remains deferred.
- **Customer iOS** has no Android counterpart; that is by ADR, not a D1 defect.

## Not proven

Device/emulator smoke, Play upload, and production Android runtime. Those stay OWNER_GATE / DEVICE_SMOKE.
