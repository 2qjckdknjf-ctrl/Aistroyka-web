# Manager Instrumented Test — Implementation (2026-06-28)

## Test file

`android/AiStroykaManager/src/androidTest/java/ai/aistroyka/manager/ManagerAppLaunchInstrumentedTest.kt`

## Test name

`ManagerAppLaunchInstrumentedTest.activityStarts_andComposeRootExists`

## What it verifies

- Launches Manager `MainActivity` (the declared `LAUNCHER` activity in `AndroidManifest.xml`).
- Waits for Compose to settle (`waitForIdle()`).
- Asserts the Compose root node exists (`onRoot().assertExists()`) — i.e. the app starts and mounts its UI without crashing.

## Pattern

Mirrors `android/AiStroykaWorker/src/androidTest/java/ai/aistroyka/worker/WorkerAppLaunchInstrumentedTest.kt` (PR #148), using `createAndroidComposeRule<MainActivity>()` and `@RunWith(AndroidJUnit4::class)`.

## Non-mutating / no-credential properties

| Property | Value |
|----------|-------|
| Requires network | NO |
| Requires login / credentials | NO |
| Mutates data | NO |
| Depends on production | NO |
| Scope | Launch + Compose root mount only |

Full Manager intelligence/copilot/report flows are intentionally **not** covered here — those live in the live-pilot E2E layer (iOS Layer B, PR #154). This is a launch smoke only.

## Required build config (justified)

The Manager module previously lacked instrumented-test wiring. Added to `build.gradle.kts` (mirroring Worker):

```kotlin
// defaultConfig
testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

// dependencies
androidTestImplementation(platform("androidx.compose:compose-bom:2023.10.01"))
androidTestImplementation("androidx.compose.ui:ui-test-junit4")
androidTestImplementation("androidx.test.ext:junit:1.1.5")
androidTestImplementation("androidx.test:runner:1.5.2")
debugImplementation("androidx.compose.ui:ui-test-manifest")
```

No production source or app behavior was modified.
