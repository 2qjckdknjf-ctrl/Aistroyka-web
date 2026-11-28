# Mobile Mode B upload evidence — 2026-11-28

Gate verification (same shell/session before upload): `APPROVE_TESTFLIGHT_UPLOAD=YES`, `APPROVE_GOOGLE_PLAY_UPLOAD=YES`, ASC `.p8` + key/issuer, Play service-account JSON, Apple Distribution identity `Apple Distribution: Aleksandr Potkin (43A4KW5BKB)`, `ios/ExportOptions-AppStore.plist`, Android `keystore.properties` + upload keystore, arm64 JDK 17 (`jbr-17.0.14`), `ANDROID_HOME`.

Build numbers: iOS `AISTROYKA_IOS_BUILD_NUMBER=2026112801`, Android `AISTROYKA_ANDROID_VERSION_CODE=2026112801`.

`Info.plist` `CFBundleVersion` for Worker/Manager bumped to `2026112801` (hardcoded plist previously overrode project version — archive metadata verified before export).

## iOS TestFlight

| App | Archive | Export | Signing on IPA | Upload |
|---|---|---|---|---|
| Worker (`ai.aistroyka.worker`) | SUCCEEDED (`CFBundleVersion=2026112801`) | SUCCEEDED | Apple Distribution | **UPLOAD SUCCEEDED** Delivery UUID `2f4101cb-099e-4e9c-b4cb-6f8da03cfc92` |
| Manager (`ai.aistroyka.manager`) | SUCCEEDED (`CFBundleVersion=2026112801`) | SUCCEEDED | Apple Distribution | **UPLOAD SUCCEEDED** Delivery UUID `f2149b58-3b40-44ec-a6ac-21b1d39bff2f` |

ASC API readback (same day): both builds `2026112801` → **processingState=VALID** (Worker + Manager). Tester assignment / device install still owner/console.

Local artifacts (gitignored): `build/mode-b-20261128/{worker,manager}-ipa/*.ipa`, `*.xcarchive`, upload logs.

## Android Google Play (internal)

AAB `targetSdkVersion=35` / `compileSdk=35` / `versionCode=2026112801` (verified in bundle merged manifest).

| App | Bundle | Track update | Commit |
|---|---|---|---|
| Worker | upload OK `versionCode=2026112801` | `internal` **draft** | **DRAFT_COMMITTED** edit `15944070430972498576` |
| Manager | upload OK `versionCode=2026112801` | `internal` **draft** | **DRAFT_COMMITTED** edit `00867891647348898131` |

`status=completed` still rejected by Play with cryptic `403 Target SDK of artifact is too low: <versionCode>` despite AAB targetSdk 35 (same residual Console policy seen 2026-11-25). Draft path is the documented Mode B workaround; promote draft→completed in Play Console when listing/policy gates allow.

Prior internal: completed `2026063001` + prior draft `2026112501` remain on track.

## Not claimed

- Physical device smoke (`DEVICE_SMOKE_PARTIAL` without connected device)
- Play `completed` / production track
- ASC processing VALID without ASC UI/API confirmation
