# Mobile pilot readiness

## iOS Manager (AiStroykaWorker)

- **Status:** Codebase present; API aligned with v1; x-client not in lite allow-list so manager can call full API.
- **Pilot:** Validate auth (token refresh, re-auth) and critical flows on device against production.
- **Crash reporting:** Add Sentry or similar (abstraction + config doc); CONFIG-REQUIRED.

## iOS Worker Lite (WorkerLite → AiStroykaWorker)

- **Status:** Rename in progress (see IOS_RENAME_COMPLETION_PLAN.md). Git shows deleted WorkerLite files and new AiStroykaWorker app entries.
- **Pilot blocker:** Complete rename and stabilize build before including lite in pilot; or run pilot with Manager only.
- **API:** Lite allow-list permits config, worker/*, sync/*, media/upload-sessions*, devices*, reports/[id]/analysis-status.

## Android

- **Status:** No app in repo; android_lite in allow-list for future client.
- **Pilot:** N/A.

## API contract

- Manager and lite use same v1 base URL; lite restricted by path; manager has full v1 access.
- No breaking mismatch identified.
