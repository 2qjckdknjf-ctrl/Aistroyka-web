# Phase 6 — Android Current-Main Certification

**Date:** 2026-08-22  
**Baseline SHA:** `a7144249ed0cf1f049cfbdaa9e36e722b1bcfcc8` (`a714424`)  
**Branch:** `feature/phase6-android-certification-2026-08-22`  
**JDK:** OpenJDK 17.0.18  
**Gradle:** 8.7 / AGP 8.6.1  
**Status:** **IN PROGRESS**

---

## 1. Toolchain

| Check | Result |
|-------|--------|
| Java 17 | **PROVEN** |
| Gradle wrapper 8.7 | **PROVEN** |
| `compileSdk` / `targetSdk` 35 | **PROVEN** (both apps) |
| `minSdk` 26 | **PROVEN** |

## 2. Build certification (@ `a714424` + Worker MDC fix)

| App | Task | Result |
|-----|------|--------|
| `:shared:test` | unit tests | **PROVEN** PASS |
| AiStroykaManager | `assembleDebug` | **PROVEN** PASS |
| AiStroykaWorker | `assembleDebug` | **PROVEN** PASS (after MDC dep fix) |
| AiStroykaManager | `bundleRelease` | **PROVEN** PASS — signed AAB `8.7M` |
| AiStroykaWorker | `bundleRelease` | **PROVEN** PASS — signed AAB `9.0M` (`versionCode=2026082201`) |
| Manager | `assembleDebugAndroidTest` | **PROVEN** PASS (compile) |
| Worker | `assembleDebugAndroidTest` | **PROVEN** PASS (compile) |

**Fix applied:** `android/AiStroykaWorker/build.gradle.kts` — add `com.google.android.material:material:1.12.0` (Manager already had it; Worker XML theme requires MDC attrs).

## 3. Instrumented tests

| Target | Result |
|--------|--------|
| `ManagerAppLaunchInstrumentedTest` | **NOT TESTED** — no emulator/device connected |
| `WorkerAppLaunchInstrumentedTest` | **NOT TESTED** — no emulator/device connected |

## 4. Distribution readiness

| Check | Result |
|-------|--------|
| Release signing (`keystore.properties` + upload keystore) | **PROVEN** — local signing assets present (gitignored) |
| Signed release AAB generation | **PROVEN** |
| Google Play upload (`APPROVE_GOOGLE_PLAY_UPLOAD=YES`) | **BLOCKED_EXTERNAL** — gate not granted this session |
| Play service account JSON | **NOT VERIFIED** this session |
| Live FCM delivery | **NOT TESTED** — deferred track; placeholder Firebase config on Worker |

## 5. Known gaps (mobile store-readiness M0)

| Item | Status |
|------|--------|
| Durable offline queue (Worker) | **OPEN** |
| Live FCM on device | **OPEN** |
| Manager tab parity vs iOS | **OPEN** — thinner scaffold |
| Task Chat UI | **ABSENT** on Android |
| Play Console upload evidence | **BLOCKED_EXTERNAL** — Mode B gate |

## 6. Blockers

| Blocker | Type |
|---------|------|
| Google Play upload not authorized | **BLOCKED_EXTERNAL** — `APPROVE_GOOGLE_PLAY_UPLOAD` unset |
| No emulator/device for instrumented smoke | **BLOCKED_EXTERNAL** |
| Android deferred for first pilot Day-0 | **DEFERRED BY DECISION** — readiness track only |

## 7. Closure verdict

**CONDITIONAL YES** — latest `origin/main` Android Manager + Worker debug builds, shared unit tests, release signed AABs, and instrumented-test compile all **PROVEN** locally; Play upload and on-device instrumented smoke remain owner-gated.

**Next:** owner Mode B gate for Play Internal Testing upload; AVD/device instrumented smoke; continue store-hygiene from `docs/audit/mobile-store-readiness-2026-08-21/`.

---

*Phase 6 — 100% Readiness execution.*
