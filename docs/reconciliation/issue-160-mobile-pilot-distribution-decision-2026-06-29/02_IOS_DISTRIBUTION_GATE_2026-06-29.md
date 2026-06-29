# iOS Distribution Gate

Source: PR #161 / issue #158 (`docs/reconciliation/issue-158-ios-distribution-preflight-2026-06-29/`).

## Build/archive evidence

| Item | Result |
| --- | --- |
| Manager no-sign archive | **ARCHIVE SUCCEEDED** |
| Worker no-sign archive | **ARCHIVE SUCCEEDED** |
| Bundle IDs | `ai.aistroyka.manager`, `ai.aistroyka.worker` |
| Apple Team | `43A4KW5BKB` |
| Signing mode | Automatic / Apple Development (Distribution cert required for release) |

## Readiness verdicts

| Target | Verdict |
| --- | --- |
| TestFlight readiness | **OWNER_ACTION_REQUIRED** |
| App Store readiness | **OWNER_ACTION_REQUIRED** |

## Blockers

1. Distribution certificate + App Store provisioning required.
2. ASC API key / access (or interactive Xcode upload path) not configured locally.
3. App-store `ExportOptions.plist` not present.
4. Push Notifications / Sign in with Apple capability decision required.
5. Store metadata / privacy not locally verifiable.
6. Build number bump required per upload.

## Owner actions

- Provide/verify Distribution certificate and App Store provisioning profiles.
- Decide Push Notifications + Sign in with Apple capability scope.
- Add/verify app-store `ExportOptions.plist`.
- Configure ASC API key or choose interactive Xcode upload path.
- Complete store metadata + privacy declarations.
- Bump build number; produce signed archive + TestFlight upload evidence.

## State

- Issue #158: **OPEN**
- **iOS distribution gate verdict: OWNER_ACTION_REQUIRED (BLOCKED for upload).**
