# Wave 0.5 — Android non-bypass truth (Release 1 Worker submit)

**Date:** 2026-03-26 (UTC)  
**Scope:** Establish **truth** of `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` — **no** worker reporting redesign.

---

## 1. Code paths (exact)

| Location | Behavior |
|----------|----------|
| `android/AiStroykaWorker/build.gradle.kts` | **Debug:** `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` = **`!pilotRealSubmit`** (default `pilotRealSubmit` false → **true** bypass). **Release:** always **`false`** (no bypass). |
| `android/AiStroykaWorker/.../WorkerViewModel.kt` `submitReport()` | If `!photoAttached && !BuildConfig.PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` → sets `submitMessage = "Attach a photo first"` and **returns** — no API call. |
| `android/AiStroykaWorker/.../WorkerApp.kt` Submit button | `enabled = !state.busy && (state.photoAttached \|\| BuildConfig.PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO)` — bypass allows **enabled** button without photo in debug. |

**Photo attach path:** ViewModel sets `photoAttached = true` after successful pipeline step (see `WorkerViewModel.kt` ~235).

---

## 2. Build variants matrix

| Variant | `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` | Submit without photo |
|---------|-------------------------------------|----------------------|
| **debug** (default Gradle) | **`true`** | **Allowed** (UI + ViewModel guard both honor flag) |
| **debug** + `-PpilotRealSubmit=true` | **`false`** | **Blocked** — same rule as release |
| **release** | **`false`** | **Blocked** |

**Proof:** Gradle `generateDebugBuildConfig` / `assembleRelease` + generated `BuildConfig.java` (local path under `android/AiStroykaWorker/build/generated/...`; **do not commit**; file may contain secrets from `local.properties`).

---

## 3. Commands run (evidence)

| Command | Result |
|---------|--------|
| `./gradlew :AiStroykaWorker:assembleRelease` | **BUILD SUCCESSFUL** |
| `./gradlew -PpilotRealSubmit=true :AiStroykaWorker:generateDebugBuildConfig` then grep `PILOT` | **`PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO = false`** |
| `./gradlew :AiStroykaWorker:generateDebugBuildConfig` (default) | **`PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO = true`** |
| `scripts/android/verify-worker-release-no-photo-bypass.sh` | **OK** — asserts release flag false without dumping BuildConfig |

---

## 4. Minimal fixes made (Wave 0.5)

| Item | Path |
|------|------|
| Release proof script | `scripts/android/verify-worker-release-no-photo-bypass.sh` |

**No** changes to `WorkerViewModel`, `WorkerApp`, or Gradle logic.

---

## 5. Trust conclusion for Wave 1

| Question | Answer |
|----------|--------|
| Can **release** Android Worker proof be trusted as **no photo bypass**? | **YES** — `release` **always** compiles with `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO = false`. |
| Can **default debug** proof be trusted? | **NO** — default debug has bypass **ON**. Proof must use **`assembleRelease`**, **installRelease** (where configured), or **`-PpilotRealSubmit=true`** on debug. |
| Does bypass affect **runtime** outside build variant? | **No** — compile-time `BuildConfig` only. |

**Operational rule for Wave 1+:** Reference Worker submit proof MUST specify **release** or **pilotRealSubmit debug**; Maestro on default debug is **automation-only**, not R1 **truth**.
