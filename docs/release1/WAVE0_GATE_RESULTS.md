# Wave 0 — Gate results (G0, G1, G2, G3, G9)

**Date:** 2026-03-26 (UTC)

---

| Gate | Status | Evidence |
|------|--------|----------|
| **G0** — iOS reproducible build | **PASS** (simulator, unsigned) | `xcodebuild` with `-sdk iphonesimulator`, `CODE_SIGNING_ALLOWED=NO` → **BUILD SUCCEEDED** for `AiStroykaWorker` and `AiStroykaManager`. Script: `scripts/ios/build-simulator.sh`. **FAIL** path documented: device build without provisioning / team. |
| **G1** — Android build / test truth | **PARTIAL** | **PASS:** `./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug` **BUILD SUCCESSFUL**. **FAIL (test):** **0** `**/test/**/*.kt` files — no authoritative unit/instrumented tests. **Pilot:** `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` documented — release proof must avoid debug bypass. |
| **G2** — Authoritative CI | **PASS** (with Wave 0 fix) | Root `.github/workflows/deploy-cloudflare-prod.yml` = **production**. Root `.github/workflows/ci.yml` **added** = **PR CI** (lint, test, cf:build, e2e). Nested `apps/web/.github/workflows/ci.yml` = **non-authoritative duplicate** until removed. **Gap:** no iOS/Android jobs. |
| **G3** — Auth / tenant / role matrix | **PASS** (documentation) | `WAVE0_AUTH_TENANT_MATRIX.md` — roles, lite allow list, admin layout, middleware. **PARTIAL:** runtime Bearer matrix not executed as automated suite in Wave 0. |
| **G9** — Worker-scope decision | **READY FOR DECISION** | `WAVE0_G9_DECISION_INPUT.md` — gaps listed; **no** waiver signed in repo. |

---

## Release 1 implementation start?

**Conditionally allowed:** **Wave 1** product work may start **only** after:

1. **G9** business decision (or explicit waiver doc) for video/voice/comment/tri-state.  
2. Acceptance that **G1 test gap** remains until tests land.  
3. **iOS device signing** path owned by org (outside Wave 0 proof).

**Not allowed:** Treat Wave 0 as **full** production readiness — **CI gaps** (mobile) and **test gaps** (Android) remain.
