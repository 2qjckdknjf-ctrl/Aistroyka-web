# Wave 0 — Build truth (G0 / G1)

**Date:** 2026-03-26 (UTC)  
**Repo root:** `/Users/alex/Projects/AISTROYKA`  
**Host:** macOS with Xcode (path used: `/Applications/Xcode.app/...`).

---

## 1. iOS (G0)

### 1.1 Project locations

| App | Path | Scheme | Target | SPM dependency |
|-----|------|--------|--------|----------------|
| Worker | `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` | `AiStroykaWorker` | `AiStroykaWorker` | Local package **Shared** → `ios/Shared` |
| Manager | `ios/AiStroykaManager/AiStroykaManager.xcodeproj` | `AiStroykaManager` | `AiStroykaManager` | Local package **Shared** → `ios/Shared` |
| Shared (library) | `ios/Shared/Package.swift` | — | `Shared` | — |

**iOS Client app:** **No** third Xcode project or target in `ios/` — **IN R1 — NEW BUILD REQUIRED** per `PHASE1_FINAL_SCOPE.md`.

### 1.2 Commands run (evidence)

| Command | Result |
|---------|--------|
| `xcodebuild -list -project ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` | **OK** — scheme `AiStroykaWorker`, target `AiStroykaWorker`, Shared resolved @ `ios/Shared` |
| `xcodebuild -list -project ios/AiStroykaManager/AiStroykaManager.xcodeproj` | **OK** — scheme `AiStroykaManager`, Shared resolved @ `ios/Shared` |
| `xcodebuild -scheme AiStroykaWorker -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 16' -project ... build` | **FAIL** — resolved to **iphoneos** + **signing**: `No profiles for 'ai.aistroyka.worker'` / provisioning |
| `xcodebuild -scheme AiStroykaWorker -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO` | **BUILD SUCCEEDED** — output under DerivedData `Debug-iphonesimulator/AiStroykaWorker.app` |
| Same for `AiStroykaManager` | **BUILD SUCCEEDED** |
| `scripts/ios/build-simulator.sh` (added Wave 0) | **OK** — builds both schemes in sequence |

### 1.3 Blockers

| Blocker | Severity | Notes |
|---------|----------|--------|
| **Device / default destination without `-sdk iphonesimulator`** | **High for naive commands** | xcodebuild may select **physical device** SDK → **requires** Development Team + provisioning. |
| **Release / App Store signing** | **External** | Not exercised; requires Apple Developer account + CI secrets. |

### 1.4 Minimal fixes applied (Wave 0)

| Change | Path |
|--------|------|
| Reproducible simulator build script | `scripts/ios/build-simulator.sh` (executable) |

### 1.5 Reproducibility verdict

- **Simulator, unsigned:** **YES** — proven with commands above.  
- **Physical device, signed:** **NOT proven** in this session — **not a repo defect**; requires org signing setup.

---

## 2. Android (G1)

### 2.1 Modules

From `./gradlew projects`:

- `:AiStroykaWorker`
- `:AiStroykaManager`
- `:shared`

**Android Client module:** **Absent** — **IN R1 — NEW BUILD REQUIRED**.

### 2.2 Commands run

| Command | Result |
|---------|--------|
| `./gradlew :AiStroykaWorker:assembleDebug :AiStroykaManager:assembleDebug :shared:assemble` | **BUILD SUCCESSFUL** |
| `./gradlew tasks --all \| grep test` | Shows `compile*UnitTestSources`, `assembleAndroidTest`, etc. — **no** `src/test` **sources** in repo (`glob **/test/**/*.kt` → **0** files) |

### 2.3 Pilot / debug flags (release truth)

| Item | Location | Effect |
|------|----------|--------|
| `PILOT_ALLOW_SUBMIT_WITHOUT_PHOTO` | `android/AiStroykaWorker/build.gradle.kts` | Debug default **true** unless `-PpilotRealSubmit=true`; **release** `false`. Gates **Worker** submit proof — reference proof must not rely on debug bypass. |

### 2.4 Test truth

| Item | Status |
|------|--------|
| **Unit tests** | **No test sources** — `test` Gradle tasks exist but **authoritative automated tests are absent**. |
| **Authoritative test task** | **NONE** until tests are added — **G1 partial** on “test truth”. |

### 2.5 Minimal fixes applied

**None** — builds already green.

---

## 3. Summary

| Platform | Compile reproducible (this machine) | Signing | Automated tests |
|----------|-------------------------------------|---------|-----------------|
| iOS Simulator | **YES** (documented flags + script) | N/A (disabled) | Not in Wave 0 scope |
| iOS Device | **NOT proven** | **Required** | — |
| Android debug | **YES** | Debug keystore (Gradle default) | **0** test files |
