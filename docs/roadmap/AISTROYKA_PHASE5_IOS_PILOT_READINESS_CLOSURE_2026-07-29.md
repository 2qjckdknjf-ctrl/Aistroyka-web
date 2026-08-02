# Phase 5 — iOS Pilot Readiness Closure

**Date:** 2026-07-29 (evidence completed into 2026-07-30 local)  
**Verdict:** **YES**  
**Safe to proceed to Phase 6:** **YES**  
**Launch YES:** **NO** (physical device smoke + TestFlight upload still external / not authorized)

## Scope

Close iOS pilot readiness with dedicated-simulator Layer B lifecycle:

Worker login → project/task → report draft → before/after media → durable queue → offline pause/relaunch/resume → submit → Manager changes_requested → Worker resubmit → Manager approve.

No Android. No commit/push/PR/deploy/migration. No TestFlight upload. No unauthorized Apple state mutation.

## Evidence summary

| Gate | Result |
|------|--------|
| Shared XCTest | PASS (5 tests) |
| Worker Debug/Release simulator builds (`CODE_SIGNING_ALLOWED=NO`) | PASS |
| Manager Debug/Release simulator builds (`CODE_SIGNING_ALLOWED=NO`) | PASS |
| Worker login smoke UITest | PASS |
| Manager login smoke UITest | PASS |
| Canonical Layer B lifecycle (dedicated sim) | PASS |
| Mobile brand drift | PASS |
| Secret/signing tracked-artifact scan | PASS (`Secrets.xcconfig` not tracked) |
| `git diff --check` | PASS |
| `check:design` / `i18n:check` / lint | PASS |
| Full unit suite | PASS (417 files / 2687 tests) |
| `bun run build` | PASS |
| `bun run cf:build` | PASS |
| npm-lock validation | PASS |
| `npm audit --omit=dev` | PASS (0 vulnerabilities) |
| Cleanup + smoke membership unchanged | PASS |
| Physical device smoke | BLOCKED_EXTERNAL (`IOS_PHASE5_ALLOW_DEVICE` unset) |
| TestFlight upload | NOT_AUTHORIZED / BLOCKED_EXTERNAL |

## Layer B proof (mandatory)

- Orchestrator: `ios/scripts/run-ios-phase5-layerb.sh` → `ios/scripts/phase5-orchestrate.mjs`
- Dedicated simulator naming: `AISTROYKA-Phase5-<runId>` (created, used exclusively, deleted in cleanup)
- Separate DerivedData under `/tmp/aistroyka-phase5-dd-*`
- Temporary personas via service role fixture only; report/media/submit/review via real app UI/API
- Marker: `PHASE5 TEMP <runId>`
- Final successful run log: `/tmp/aistroyka-phase5-orch/layerb15.log`
  - `LAYER_B: PASS`
  - `CLEANUP: PASS`
  - `VERDICT: YES`
  - `PHYSICAL_DEVICE_SMOKE: BLOCKED_EXTERNAL`
  - `TESTFLIGHT_UPLOAD: NOT_AUTHORIZED`

### UITest counts (canonical Layer B run)

| Metric | Count |
|--------|------:|
| Executed | 4 |
| Passed | 4 |
| Failed | 0 |
| Skipped | 0 |

Tests:

1. `WorkerPhase5UITests/testWorker_phase5_fullSubmitWithOfflineQueue`
2. `ManagerPhase5UITests/testManager_phase5_requestChangesOnExactReport`
3. `WorkerPhase5UITests/testWorker_phase5_resubmitAfterChangesRequested`
4. `ManagerPhase5UITests/testManager_phase5_approveExactReport`

Plus separate login smokes (roadmap commands) on dedicated gate simulator: Worker + Manager PASS.

## Defects found and fixed (in-scope)

1. **`upload_path` decode drop** — `APIClient` uses `.convertFromSnakeCase` while DTOs used snake_case `CodingKeys`, so Worker fell back to tenant-less `media/{sessionId}` → Storage HTTP 400 → submit never enabled. Fixed `UploadSessionResponse` (+ related Shared sync DTOs) and hardened WorkerAPI (no tenant-less fallback). Added Shared decode regression tests.
2. **Lite `/api/v1/me` allow-list** — `ios_worker` needed GET `/me` for persona preflight; allow-list updated (with tests).
3. **Manager project deeplink blocked Reports tab** when both project + report E2E ids were set. Prefer reports tab shell when `e2eReportId` present.
4. **Manager review status a11y** — status/result nodes unreliable inside `LabeledContent`/lazy `List`. Status chip outside List; review actions moved above List so approve/request-changes always materialize for XCTest.
5. **Worker `manager_note` decode drop** — same snake_case CodingKeys conflict on `WorkerReportDetailData`; fixed so resubmit UI shows manager note.
6. **E2E storage upload reliability** — XCTest path uses synchronous foreground upload (`uploadSynchronouslyForE2E`) instead of background URLSession.
7. **ATS for loopback** — scoped `NSAllowsLocalNetworking` (not `NSAllowsArbitraryLoads`) on Worker/Manager Info.plist.
8. **Harness** — Phase 5 orchestrator requires distinct Worker/Manager credentials, explicit simulator UDID, no production URL fallback, fixture create/cleanup, line-buffered logs.

## Metadata (sanitized)

| Item | Worker | Manager |
|------|--------|---------|
| Display name | AiStroyka Worker | AiStroyka Manager |
| Bundle ID | `ai.aistroyka.worker` | `ai.aistroyka.manager` |
| Marketing version | 1.0 | 1.0 |
| CFBundleVersion (Info.plist) | 2026063001 | 2026063001 |
| Camera / Photo library usage | Present (Worker) | Not required for Manager review path |
| Client profile | `ios_worker` | `ios_manager` |

Note: Info.plist `CFBundleVersion` may disagree with Xcode `CURRENT_PROJECT_VERSION` depending on build settings; no new production build number invented without owner rule. Owner should confirm store build numbering before TestFlight.

## Signing / TestFlight path

- Debug/Release simulator builds: PASS without signing.
- Signing identities inventory: local Development identities present (count-only).
- App Store Connect API key path for Mode B upload: MISSING/UNSET in this session.
- No certificate import, no profile creation, no ASC upload performed.
- Physical device: inventory-only; install/launch blocked without `IOS_PHASE5_ALLOW_DEVICE=1` + `IOS_PHASE5_DEVICE_UDID` + suitable signing.

## Cleanup proof

- `PHASE5 TEMP` auth users / projects: 0
- Credential file `ios/Config/.uitest-e2e-credentials`: ABSENT after run
- Dedicated Phase 5 simulators: absent
- Smoke membership / platform grant: unchanged (orchestrator `CLEANUP_SMOKE_UNCHANGED: OK`)

## External blockers (exact owner/operator actions)

1. **Physical device smoke:** set `IOS_PHASE5_ALLOW_DEVICE=1` and `IOS_PHASE5_DEVICE_UDID=<udid>`, ensure Development signing + provisioning for both bundle IDs, then install/launch Worker+Manager on that device only.
2. **TestFlight upload:** provide Mode B gates (`APPROVE_TESTFLIGHT_UPLOAD=YES`, `AISTROYKA_IOS_BUILD_NUMBER`, ASC API key path/id/issuer, Apple Distribution + App Store profiles, `ExportOptions-AppStore.plist`) and run the existing upload runbook — not authorized in Phase 5.
3. **Owner build-number policy:** confirm whether Info.plist `CFBundleVersion` (2026063001) or project `CURRENT_PROJECT_VERSION` is canonical for the next store build.

## Closure verdict

- **Phase 5: YES**
- **Physical device smoke: BLOCKED_EXTERNAL**
- **TestFlight upload: NOT_AUTHORIZED / BLOCKED_EXTERNAL**
- **Launch YES: NO**
- **Safe to proceed to Phase 6: YES**

## Confirmation

No commit, push, PR, deploy, migration apply, tenant/platform grant creation for non-fixture accounts, unauthorized Apple Developer/App Store Connect mutation, or secret value disclosure in this phase. Fixture credentials and JWTs were handled as PRESENT/MISSING/MATCH only in logs.
