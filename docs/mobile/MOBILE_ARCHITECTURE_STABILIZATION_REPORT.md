# Mobile architecture stabilization report

**Date:** 2026-05-19

## Runtime config

| Concern | Implementation |
|---------|------------------|
| Base API URL | iOS: `Config.baseURL` from merged plist / env; Android: `BuildConfig.BASE_URL` → `AppRuntime.apiV1Root` in shared module. |
| Environment | Implicit via `BASE_URL` target (dev/staging/prod URLs), not a separate enum in mobile (documented gap: optional explicit `APP_ENV` flag **P2**). |
| Client profile | **Canonical:** `ios_worker`, `ios_manager`, `android_worker`, `android_manager`. **Legacy:** `ios_lite`, `android_lite` still accepted server-side for allow-list + idempotency. |
| Device ID | `DeviceContext.deviceId` (both platforms). |
| App version | iOS: diagnostics / bundle keys; Android: `versionName` / `versionCode` in `build.gradle.kts`. |
| Debug mode | iOS `DiagnosticsView`; Android `BuildConfig`; logs must stay free of tokens (`SafeLog` on iOS). |

## Auth

- Supabase password grant; Bearer on `/api/v1`; Keychain (iOS) / `SessionStore` (Android).
- **401:** `NotificationCenter` on iOS for worker/manager profiles; Android relies on error surfaces in ViewModels.
- **403:** Shown as API error message; lite allow-list returns `lite_client_path_forbidden`.
- **Token refresh:** Not implemented in shared REST client (**P1** — document; no silent refresh loop).
- **Logout:** clears session; Worker iOS unregisters device; Android Worker mirrors unregister.

## API client

- Central layer: iOS `APIClient` actor; Android `ApiClient` object.
- Headers: `Authorization`, `x-client`, `x-device-id`, `x-idempotency-key` on writes where used.
- Retries: **not** blanket-automatic (**by design** in current code); worker offline queue on **iOS** retries via `OperationQueueExecutor`.
- Timeouts: Android OkHttp 45s/120s; iOS `URLSession` defaults.

## UI state

- iOS: loading/empty/error via shared `InlineStatusViews`, manager `LoadingStateView` / `ErrorStateView` / `EmptyStateView`; worker sync status in `SyncService`.
- Android Manager: Compose patterns mirror loading/banners; Worker: banners + linear progress after this session.

## Logging

- iOS `SafeLog` / no token logging policy in code review.
- Android: avoid `Log` of tokens (**verify** in follow-up **P2**).

## Validation

| Check | Result |
|-------|--------|
| iOS Worker build | PASS |
| iOS Manager build | PASS |
| Android Worker assembleDebug | PASS |
| Android Manager assembleDebug | PASS |
| Vitest (`client-profile`, `lite-idempotency`) | PASS |

## Files touched (architecture-related)

See repo diff for `apps/web/lib/tenant/*`, `apps/web/lib/api/lite-*`, `ios/Shared/*`, `android/shared/*`, `android/AiStroykaWorker/*`.
