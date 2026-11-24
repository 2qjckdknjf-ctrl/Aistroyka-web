# Mobile Mode B upload evidence — 2026-11-25

Gate verification (same session): `APPROVE_*=YES`, ASC `.p8` + key/issuer, Play service-account JSON, Apple Distribution identity, App Store profiles for manager/worker, `ExportOptions-AppStore.plist`, Android keystore — all present. Source tree: clean worktree at `origin/main` `@937a046` (remote `release/mobile-pilot-rc` absent).

## iOS TestFlight

| App | Archive | Export | Upload | ASC processing |
|---|---|---|---|---|
| Worker (`ai.aistroyka.worker`) | SUCCEEDED | SUCCEEDED | Delivery UUID `44cf132b-1844-48be-8d86-b1aae4c48d70` | **VALID** build `2026112203` (preRelease `1.0`) |
| Manager (`ai.aistroyka.manager`) | SUCCEEDED | SUCCEEDED | Delivery UUID `398dd36c-f2d2-489b-993a-070695dcb782` | **VALID** build `2026063001` (preRelease `4.3.0`) |

Note: `Info.plist` / project `CFBundleVersion` may override `AISTROYKA_IOS_BUILD_NUMBER`; observed ASC versions above are source of truth.

## Android Google Play (internal)

| App | Prior completed | New `versionCode=2026112501` |
|---|---|---|
| Worker | completed `2026063001` | **draft committed** on `internal` (completed status rejected with cryptic `Target SDK of artifact is too low` despite AAB `targetSdkVersion=35`) |
| Manager | completed `2026063001` | **draft committed** on `internal` (same completed-vs-draft behavior) |

Promote draft→completed in Play Console when store listing / policy gates allow, or keep draft for tester opt-in.

## Runtime after evidence PR chain

Staging + production `GET /api/v1/health` → `buildStamp.sha7=733a766` (#525) observed 2026-11-24.
