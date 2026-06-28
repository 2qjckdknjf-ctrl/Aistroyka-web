# Archive / Export Preflight (no upload)

## No-sign archive dry-run

Command pattern (per app):

```
xcodebuild archive \
  -project ios/<App>/<App>.xcodeproj \
  -scheme <App> \
  -archivePath <local>/<App>.xcarchive \
  -destination "generic/platform=iOS" \
  CODE_SIGNING_ALLOWED=NO
```

| App | No-sign archive result |
|---|---|
| AiStroykaManager | **ARCHIVE SUCCEEDED** (exit 0) |
| AiStroykaWorker | **ARCHIVE SUCCEEDED** (exit 0) |

This confirms both apps compile and archive structurally for `generic/platform=iOS` (Release) with the shared SwiftPM package — the project structure is archive-ready.

Logs and `.xcarchive` outputs were written to a local, **gitignored** `evidence/` path and are **not committed**.

## Signed archive / export readiness

A real distributable archive (for TestFlight/App Store) additionally requires, none of which are verifiable/available in this headless preflight:

- An **Apple Distribution** certificate available to the signing environment.
- App Store **provisioning** (managed automatically by Xcode under Automatic signing once the Distribution cert + authenticated session exist).
- An `ExportOptions.plist` with `method = app-store` (or `app-store-connect`) for `xcodebuild -exportArchive` — **not present in repo**.
- Authenticated upload path (Xcode Organizer interactive, or App Store Connect API key for `notarytool`/`altool`/`xcrun`).

**Signed archive readiness: OWNER_ACTION_REQUIRED.**
**Export/upload readiness: OWNER_ACTION_REQUIRED.**

No upload was performed.
