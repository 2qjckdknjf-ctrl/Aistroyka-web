# Phase 5 — iOS Current-Main Certification

**Date:** 2026-08-22  
**Baseline SHA:** `a7144249ed0cf1f049cfbdaa9e36e722b1bcfcc8` (`a714424`)  
**Branch:** `feature/phase5-ios-certification-2026-08-22`  
**Simulator UDID:** `61119C43-B820-4109-9D0D-ACDE809191D6`  
**Layer B target:** `https://staging.aistroyka.ai`  
**Status:** **IN PROGRESS**

---

## 1. Build certification (@ `a714424`)

| App | Configuration | Result |
|-----|---------------|--------|
| AiStroykaWorker | Debug simulator | **PROVEN** — BUILD SUCCEEDED |
| AiStroykaManager | Debug simulator | **PROVEN** — BUILD SUCCEEDED |
| AiStroykaWorker | Release archive (device) | **PROVEN** — ARCHIVE SUCCEEDED (`CFBundleShortVersionString=1.0`, `CFBundleVersion=2026063001`) |
| AiStroykaManager | Release archive (device) | **PROVEN** — ARCHIVE SUCCEEDED |

## 2. UITest smoke (Layer A — login surface)

| Target | Result |
|--------|--------|
| Worker `WorkerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers` | **PROVEN** PASS |
| Manager `ManagerSmokeUITests/testLoginScreen_reachableWithPilotIdentifiers` | **PROVEN** PASS |

Command: `CI_SIGNING_HACK=1 bash ios/scripts/run-ios-uitest-smoke-local.sh`

**Fix applied:** `ios/scripts/run-ios-uitest-smoke-local.sh` — guard empty `SIGN` array under `set -u` (same fix as Phase 1 PR #228).

## 3. Layer B live pilot E2E (staging)

| Target | Result |
|--------|--------|
| Worker `testWorker_livePilot_loginAndOpenNewReportDraft` | **PROVEN** PASS |
| Manager intelligence / copilot / reports inbox suite | **PROVEN** PASS |

Command: `IOS_E2E_BASE_URL=https://staging.aistroyka.ai CI_SIGNING_HACK=1 bash ios/scripts/run-ios-e2e-integration-local.sh`

## 4. Signing / distribution readiness

| Check | Result |
|-------|--------|
| Apple Distribution identity in keychain | **PROVEN** — `Apple Distribution: Aleksandr Potkin (43A4KW5BKB)` |
| `ios/ExportOptions-AppStore.plist` | **PROVEN** PRESENT |
| Release archive validate-for-store | **PROVEN** — both apps passed Xcode store validation step |
| TestFlight upload (`APPROVE_TESTFLIGHT_UPLOAD=YES`) | **BLOCKED_EXTERNAL** — gate not granted this session |
| ASC API key (`.p8`) in `local-secrets/` | **MISSING** — owner-gated Mode B |
| Physical device smoke | **NOT TESTED** — no device connected |
| Live APNS delivery proof | **NOT TESTED** — requires device + token |

## 5. Store-readiness open items (from mobile audit M0)

| Item | Status |
|------|--------|
| Account deletion flow (App Store requirement) | **OPEN** — store hygiene track |
| Legal links in-app (Privacy/ToS) | **OPEN** — depends on PR #229 merge |
| Push entitlements end-to-end on device | **OPEN** |
| TestFlight processing evidence | **BLOCKED_EXTERNAL** — Mode B upload gate |

## 6. Blockers

| Blocker | Type |
|---------|------|
| TestFlight upload not authorized | **BLOCKED_EXTERNAL** — `APPROVE_TESTFLIGHT_UPLOAD` unset |
| ASC API key path not staged | **BLOCKED_EXTERNAL** |
| Physical device smoke incomplete | **DEVICE_SMOKE_PARTIAL** |
| Store hygiene (account deletion, legal in-app) | **OPEN** — separate M1 slice |

## 7. Closure verdict

**CONDITIONAL YES** — latest `origin/main` iOS Manager + Worker build, UITest smoke, Layer B staging E2E, and Release archive all **PROVEN** locally; TestFlight upload and physical device smoke remain owner-gated.

**Next:** owner Mode B gate for TestFlight upload; physical device smoke; close store-hygiene items from `docs/audit/mobile-store-readiness-2026-08-21/`.

---

*Phase 5 — 100% Readiness execution.*
