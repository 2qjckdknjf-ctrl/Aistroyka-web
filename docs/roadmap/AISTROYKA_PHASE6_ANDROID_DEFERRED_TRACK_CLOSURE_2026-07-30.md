# Phase 6 — Android Deferred Track Closure

**Date:** 2026-07-30  
**Verdict:** **YES — DEFERRED**  
**Selected track:** **deferred** (not Android MVP readiness)  
**Safe to proceed to Phase 7:** **YES**  
**Android first-pilot commitment:** **NO**  
**Android launch:** **NO**

## Scope

Lock the Android deferred track for the first pilot:

- Keep Android **buildable** (shared tests + Worker/Manager Debug).
- Keep claims honest (no pilot / Play / live-FCM / offline-first readiness).
- Do **not** start Android MVP, emulator/device smoke, Play upload, or Firebase production replacement.

No commit, push, PR, deploy, migration apply, emulator/device run, Firebase/Play mutation, signing upload, account/fixture creation, or secret disclosure.

## Decision preflight

| Check | Result |
|-------|--------|
| Authoritative first-pilot policy | Web + iOS; Android deferred (P3 Option A) |
| Newer owner/client Android mandate | **NO** |
| Historical `FIRST_CLIENT_SCOPE_LOCK` (2026-03-24) Android-mandatory line | **Superseded** by P3 / Phase 6; banner added |
| Selected track | **DEFERRED** |
| Formal owner signature on defer doc | **OPEN** (governance follow-up) |
| Operational default defer | **ACTIVE** |
| Android MVP authorized | **NO** |

### Governance honesty

- **Operational default defer — ACTIVE** (safe program policy: do not expand Android).
- **Formal signature — OPEN** (do not invent a signature).
- Formal signature is **not** treated as a blocker that forces Android implementation; it remains an owner follow-up while implementation stays unauthorized.

## Toolchain (sanitized)

| Item | Status |
|------|--------|
| JDK 17 (`jbr-17.0.14`) | PRESENT / used |
| Android SDK (`ANDROID_HOME`) | PRESENT |
| Gradle wrapper 8.7 / AGP 8.6.1 | PRESENT |
| Worker `applicationId` | `ai.aistroyka.worker` |
| Manager `applicationId` | `ai.aistroyka.manager` |
| compileSdk / targetSdk / minSdk | 35 / 35 / 26 |
| versionName | `1.0.0` (local versionCode default unless overridden) |

## Android validation (fresh)

| Gate | Result |
|------|--------|
| `:shared:test` | **PASS** — 10 unique unit tests (20 executions across debug+release variants), 0 failures |
| `:AiStroykaWorker:assembleDebug` | **PASS** |
| `:AiStroykaManager:assembleDebug` | **PASS** |
| Worker/Manager `testDebugUnitTest` | **NO-SOURCE** (no app-module unit tests; shared covers contract) |
| `:AiStroykaWorker:lintDebug` | **PASS** — warnings only (0 Error/Fatal) |
| `:AiStroykaManager:lintDebug` | **PASS** — warnings only (0 Error/Fatal) |
| `debugCompileClasspath` dependency resolution | **PASS** |
| `scripts/android/verify-worker-release-no-photo-bypass.sh` | **PASS** |
| `scripts/mobile/check-mobile-brand-drift.mjs` | **PASS** |
| Connected/instrumented / emulator / device | **NOT_IN_SCOPE** |

Required command:

```bash
JAVA_HOME=/Users/alex/Library/Java/JavaVirtualMachines/jbr-17.0.14/Contents/Home \
  ./gradlew :shared:test :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug
```

## Backend / client contract (read-only vs Phase 4)

| Profile / concern | Status |
|-------------------|--------|
| Worker `android_worker` | MATCH (WorkerApplication) |
| Manager `android_manager` | MATCH (ManagerApplication) |
| Bearer + `x-device-id` + `x-client` + `x-idempotency-key` | MATCH (`ApiClient`) |
| Worker allow-list membership | MATCH (`lite-allow-list` includes `android_worker`) |
| Worker sync/media/device/report paths | Compile-time parity with Phase 4 matrix |
| Manager report/review paths | Compile-time parity with Phase 4 matrix |
| Runtime / device E2E | **Absent** — does **not** imply pilot-ready |

**Worker compile-time API parity:** YES  
**Manager compile-time API parity:** YES  
**Runtime/device proof:** NO  
**Pilot-ready claim from this:** NO

## Firebase / FCM (sanitized)

| Item | Status |
|------|--------|
| `google-services.json` | PRESENT |
| Project class | PLACEHOLDER |
| Package name vs `ai.aistroyka.worker` | MATCH |
| Google Services plugin + Firebase BOM messaging | PRESENT |
| `WorkerFirebaseMessagingService` + manifest | PRESENT |
| Token registration path (`PushRegistrationService` / devices API) | PRESENT (compile) |
| Phase 4 live FCM credentials | BLOCKED_EXTERNAL |
| Production service-account secret in repo | MISSING (expected) |

Honest summary:

- **Firebase compile wiring:** YES  
- **Live FCM delivery:** BLOCKED_EXTERNAL  
- **Google Play / pilot readiness:** NO  

No config replacement and no push send performed.

## Signing / Google Play (sanitized)

| Level | Status |
|-------|--------|
| Debug buildability | PASS |
| Release signing configuration | PRESENT locally (`keystore.properties` keys PRESENT; keystore file PRESENT) — values not disclosed |
| Play service-account JSON | MISSING |
| Signed AAB proven for Play this phase | NO (not claimed; `bundleRelease` / Play upload not run as distribution proof) |
| Google Play internal testing | NOT_AUTHORIZED |
| Google Play production readiness | NO |

Mode B / reconciliation docs remain owner-gated historical evidence (`docs/reconciliation/issue-159-*`). No Play Console / Firebase Console / GCP mutation.

## Brand + claims

- Mobile brand drift check: **PASS** (no Android redesign).
- Public site: no active Google Play / Android download CTA found.
- Active misleading claims corrected (see claims matrix CSV).
- Historical reports preserved; superseded/dated banners added where titles could mislead.

Allowed current wording:

> Android Worker and Manager remain a buildable engineering foundation and are deferred from the first pilot. Runtime device, offline parity, live FCM and Google Play distribution are not claimed.

## Repository gates (fresh; not Phase 5 counts reused as Android proof)

| Gate | Result |
|------|--------|
| `bun run --cwd apps/web check:design` | PASS |
| `bun run i18n:check` | PASS |
| `bun run lint` | PASS |
| `bun run test` | PASS — **417** files / **2687** tests |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| `node scripts/ci/validate-npm-lock.cjs` | PASS |
| `npm audit --omit=dev` (root + packages/contracts) | PASS — 0 vulnerabilities |
| `git diff --check` (Phase 6 touched files) | PASS |

## Defects found and fixed

1. **Stale active claim** in `docs/pilot/RELEASE_CHANNELS_AND_ENVIRONMENTS.md` (“No Android app in repo yet”) → corrected to deferred foundation / Play NOT_AUTHORIZED.
2. **android/README.md** implied product offline sync → clarified deferred foundation + no durable offline queue.
3. **MOBILE_PILOT_READINESS** still described Worker as `android_lite` and Android builds as unvalidated → updated to `android_worker` / Phase 6 Debug PASS / deferred.
4. **FIRST_CLIENT_SCOPE_LOCK** still readable as current Android mandate → SUPERSEDED banner (historical body preserved).
5. **ANDROID_*_100_COMPLETION_REPORT** titles could imply product 100% → historical/supersession banners (verdicts already NOT READY).
6. Truth index / P2 / P3 defer+GO-NO-GO notes updated for Phase 6 without rewriting historical P3/P5 verdicts.

No Android product-scope expansion. No compile defects required code fixes in this phase (Gradle green on first required run).

## Files changed (Phase 6)

- `android/README.md`
- `docs/mobile/P3_ANDROID_DEFER_DECISION.md`
- `docs/mobile/P3_ANDROID_GO_NO_GO.md`
- `docs/mobile/P3_ANDROID_CURRENT_STATE.md`
- `docs/mobile/ANDROID_WORKER_100_COMPLETION_REPORT.md`
- `docs/mobile/ANDROID_MANAGER_100_COMPLETION_REPORT.md`
- `docs/pilot/RELEASE_CHANNELS_AND_ENVIRONMENTS.md`
- `docs/pilot/DIAGNOSTICS_SURFACES.md`
- `docs/pilot/P2_PILOT_READINESS_CHECKLIST.md`
- `docs/launch/FIRST_CLIENT_SCOPE_LOCK.md`
- `docs/mobile/P3_ANDROID_POST_AUDIT.md`
- `docs/release-hardening/MOBILE_PILOT_READINESS.md`
- `docs/CURRENT_PROJECT_TRUTH_INDEX.md`
- `docs/roadmap/AISTROYKA_PHASE6_ANDROID_DEFERRED_TRACK_CLOSURE_2026-07-30.md` (this file)
- `docs/roadmap/AISTROYKA_PHASE6_ANDROID_CLAIMS_MATRIX.csv`

## External / governance follow-ups

1. Owner signature on `P3_ANDROID_DEFER_DECISION.md` (OPEN).
2. Live FCM credentials / QA token (BLOCKED_EXTERNAL) — only if Android push readiness is later authorized.
3. Google Play Mode B gates + service account + Console app records — NOT_AUTHORIZED until readiness track.
4. If a client later requires Android-only field devices → **STOP** for owner decision (iOS devices or authorize Android Worker MVP).

## Closure verdict

| Item | Value |
|------|-------|
| Phase 6 | **YES — DEFERRED** |
| Formal owner signature | OPEN |
| Live Android device E2E | NOT_IN_SCOPE |
| Live FCM | BLOCKED_EXTERNAL |
| Google Play internal | NOT_AUTHORIZED |
| Android launch | NO |
| Safe to proceed to Phase 7 | **YES** |

Phase 7 was **not** started in this batch.
