# Mobile security and privacy report

**Date:** 2026-05-19

## Token storage

- iOS: Keychain (`KeychainHelper`).  
- Android: `SessionStore` uses `EncryptedSharedPreferences` + `MasterKey` in shared module.

## Logging

- iOS: `SafeLog` discipline; do not log Bearer tokens.  
- Android: targeted audit shows no `android.util.Log` / `Log.*` usage in current mobile Kotlin sources.

## API isolation

- Worker mobile headers gate lite allow-list; RBAC on routes for cross-worker isolation (per existing Wave 3 docs).  
- **This session:** `android_manager` now parses correctly (was **`web`**), improving auditability.

## Permissions

- iOS: camera / photo usage strings in Info.plist (verify per target before release).  
- Android: manifest permissions for network, images (verify before release).

## Customer finance

- Mobile surfaces reviewed as worker/manager only; no owner/customer finance vectors added.

## Verdict

**Pilot acceptable with P2 follow-ups** (release permission verification + broader runtime log policy checks in future features).
