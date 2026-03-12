# Build and Structure QA

**Date:** 2026-03-12  
**Project:** AISTROYKA mobile rebuild

---

## 1. iOS

| Check | Expected |
|-------|----------|
| Open in Xcode | Open `ios/AiStroykaManager/AiStroykaManager.xcodeproj` or `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` |
| Structure | Each project contains one app target; no WorkerLite-named target; no Manager target inside Worker project |
| Naming | Scheme and product names: AiStroykaManager, AiStroykaWorker |
| Bundle IDs | ai.aistroyka.manager, ai.aistroyka.worker |
| Imports | No cross-app imports; Shared added as local package when used |
| Build | Set Development Team; build for simulator or device. Shared package must be added to the project if app code depends on it. |

**Note:** The bootstrap projects reference only app-local sources. After adding `ios/Shared` as a package dependency, both apps can import `Shared` and build.

---

## 2. Android

| Check | Expected |
|-------|----------|
| Open in Android Studio | Open `android` folder |
| Structure | Two application modules (AiStroykaManager, AiStroykaWorker), one library (shared) |
| Naming | applicationId and app_name: AiStroyka Manager, AiStroyka Worker |
| Imports | Apps depend on `:shared`; no Worker code in Manager module or vice versa |
| Build | Gradle sync; run configuration AiStroykaManager or AiStroykaWorker. If wrapper missing, run `gradle wrapper` or let IDE sync. |

---

## 3. Naming and legacy

- **No** "WorkerLite" as primary app or target name in the new structure.
- **No** single app mixing manager and worker roles.
- Old app names (e.g. in docs or archive) are historical only; current entry points are AiStroykaManager and AiStroykaWorker on both platforms.

---

## 4. Gaps (stated clearly)

- **iOS:** Xcode project files are minimal; adding Shared as local package and linking it to both targets is manual. Asset catalogs (AppIcon, AccentColor) not created; add in Xcode if needed.
- **Android:** Gradle wrapper script (`gradlew`) not committed; user may need to run `gradle wrapper` or open in Android Studio to generate. Hilt, Retrofit/Ktor not yet added; Compose BOM and versions may need updating for latest Android Studio.
- **Signing:** iOS requires Development Team; Android may need signing config for release. Not verified in this pass.
