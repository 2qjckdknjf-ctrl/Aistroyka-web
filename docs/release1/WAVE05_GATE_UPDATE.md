# Wave 0.5 — Gate update (post-hardening)

**Date:** 2026-03-26 (UTC)

---

| Gate / concern | Wave 0 status | Wave 0.5 status | Evidence |
|----------------|---------------|-----------------|----------|
| **G0 iOS simulator build** | PASS | **PASS** (unchanged) | `scripts/ios/build-simulator.sh` |
| **G1 Android build** | PARTIAL (no tests) | **PARTIAL** | **assembleDebug** / **assembleRelease** green; **still no** `src/test` sources |
| **G1 Android non-bypass truth** | Not separate | **PASS** | `WAVE05_ANDROID_NON_BYPASS_TRUTH.md` + `verify-worker-release-no-photo-bypass.sh` |
| **G2 CI authoritative** | PASS | **PASS** (unchanged) | Root `ci.yml` + deploy prod |
| **G3 auth/tenant matrix (doc)** | PASS | **PASS** | `WAVE0_AUTH_TENANT_MATRIX.md` |
| **G3 auth/tenant runtime proof** | PARTIAL | **PARTIAL** | Wave 0.5 **did not** run Vitest/smoke (no Node in agent env); static test file inventory documented |
| **G9 decision** | READY FOR DECISION | **READY FOR SIGN-OFF** | `WAVE05_G9_FINAL_DECISION_PACKAGE.md` **draft** |
| **Minimum Wave 1 safety baseline** | N/A | **FROZEN (doc)** | `WAVE05_MINIMUM_PROOF_BASELINE.md` |

---

## May Wave 1 safely begin?

**Not fully.** Recommended sequence:

1. **Leadership** approves `WAVE05_G9_FINAL_DECISION_PACKAGE.md` (or attaches waiver).  
2. **Engineering** runs **lite-allow-list** Vitest + **CI green** on branch.  
3. Then **Wave 1** implementation (still **no** Client apps per Phase 1 order).

**Android Worker:** **Release** (non-bypass) truth is **proven** — **debug default** is **not** R1 proof without `-PpilotRealSubmit=true`.

---

## Minimal fixes in Wave 0.5

| File | Change |
|------|--------|
| `scripts/android/verify-worker-release-no-photo-bypass.sh` | **Added** — release bypass verification |

**No** product feature code changes.
