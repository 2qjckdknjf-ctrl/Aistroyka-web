# Mobile Mode B upload evidence — 2026-11-25

Gate verification (same session): `APPROVE_*=YES`, ASC `.p8` + key/issuer, Play service-account JSON, Apple Distribution identity, App Store profiles for manager/worker, `ExportOptions-AppStore.plist`, Android keystore — all present. Source tree: clean worktree at `origin/main` `@937a046` (remote `release/mobile-pilot-rc` absent).

## iOS TestFlight

| App | Archive | Export | Upload |
|---|---|---|---|
| Worker (`ai.aistroyka.worker`) | SUCCEEDED | SUCCEEDED | **UPLOAD SUCCEEDED** Delivery UUID `44cf132b-1844-48be-8d86-b1aae4c48d70` |
| Manager (`ai.aistroyka.manager`) | SUCCEEDED | SUCCEEDED | **UPLOAD SUCCEEDED** Delivery UUID `398dd36c-f2d2-489b-993a-070695dcb782` |

Build number used: `AISTROYKA_IOS_BUILD_NUMBER=2026112201` (from env). ASC processing continues asynchronously in App Store Connect (no store-live claim until processing/TestFlight availability confirmed in ASC UI).

## Android Google Play (internal)

| App | Prior internal track | New upload `versionCode=2026112501` |
|---|---|---|
| Worker | **completed** `2026063001` already on `internal` | Bundle upload OK; **commit rejected**: Play `403 Target SDK of artifact is too low: 2026112501` (bundletool dump shows `targetSdkVersion=35` / `compileSdk=35` — residual Play Console policy/error) |
| Manager | **completed** `2026063001` already on `internal` | Same commit rejection |

Conclusion: Android Mode B internal track already had a completed release (`2026063001`). Fresh bump blocked at Play commit despite targetSdk 35 in AAB — needs Play Console investigation (not a missing local credential).

## Artifacts (local, gitignored)

- `/Users/alex/Projects/AISTROYKA-mobile-mode-b-2026-11-25/artifacts/ios/`
- AABs under `android/*/build/outputs/bundle/release/`
- JSON: `MODE_B_ANDROID_UPLOAD_2026-11-25.json`
