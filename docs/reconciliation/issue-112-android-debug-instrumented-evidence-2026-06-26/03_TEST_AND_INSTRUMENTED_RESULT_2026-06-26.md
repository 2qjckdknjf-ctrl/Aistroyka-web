# Unit/shared + instrumented results (2026-06-26)

## 1. Unit / shared tests

### Command

```bash
cd android
./gradlew test --stacktrace
```

### Result

**PASS**

- Gradle exit code: `0`
- Summary: `BUILD SUCCESSFUL in 4s` — 123 actionable tasks

### Coverage

| Module | Unit tests | Result |
|--------|------------|--------|
| `:shared` | `SubmitReportBodyTest` — **4 tests**, 0 failures | PASS |
| `:AiStroykaManager` | `testDebugUnitTest` / `testReleaseUnitTest` — NO-SOURCE | N/A |
| `:AiStroykaWorker` | `testDebugUnitTest` / `testReleaseUnitTest` — NO-SOURCE | N/A |

Shared test XML: `android/shared/build/test-results/testDebugUnitTest/TEST-ai.aistroyka.shared.SubmitReportBodyTest.xml` — `tests="4" failures="0"`.

### Log

`evidence/android-debug-instrumented-2026-06-26/logs/android-test.log`

---

## 2. Instrumented launch smoke (Worker)

### Command

```bash
cd android
./gradlew :AiStroykaWorker:connectedDebugAndroidTest --stacktrace
```

Matches CI workflow `.github/workflows/android-instrumented-smoke.yml`.

### Emulator / device

- **AVD:** `Pilot_ARM64_API34` (API 34, arm64)
- **ADB:** `emulator-5554`
- **Reported device:** `Pilot_ARM64_API34(AVD) - 14`

### Result

**PASS** (after emulator restart)

- Gradle exit code: `0` (second attempt)
- Summary: `BUILD SUCCESSFUL in 11s`
- Gradle output: `Starting 1 tests on Pilot_ARM64_API34(AVD) - 14`

| Test class | Test method | Result |
|------------|-------------|--------|
| `WorkerAppLaunchInstrumentedTest` | `activityStarts_andComposeRootExists` | PASS (2.258s) |

Instrumented XML: `android/AiStroykaWorker/build/outputs/androidTest-results/connected/debug/TEST-Pilot_ARM64_API34(AVD) - 14-_AiStroykaWorker-.xml` — `tests="1" failures="0"`.

HTML report: `android/AiStroykaWorker/build/reports/androidTests/connected/debug/index.html`

### First attempt (failed — no device)

First run immediately after a separate shell session reported:

```
DeviceException: No connected devices!
```

Emulator had booted in a prior shell but was not connected when Gradle started. Emulator was restarted and test re-run successfully. Documented as operator sequencing issue, not a code failure.

### Log

`evidence/android-debug-instrumented-2026-06-26/logs/android-connected-debug-android-test.log`

### Manager instrumented tests

**NOT RUN** — no `androidTest` sources under `:AiStroykaManager` on this SHA.
