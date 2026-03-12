# iOS Full Rename — WorkerLite → AiStroyka Worker / AiStroykaWorker

**Branch:** `chore/rename-workerlite-to-aistroykaworker`  
**Date:** 2026-03-07  
**Status:** **SAFE_WITH_MANUAL_CHECKS**

---

## 1. Executive summary

The iOS app formerly named **WorkerLite** (display name "Worker Lite") has been renamed to **AiStroyka Worker** (display name) and **AiStroykaWorker** (technical identifier). Project, target, scheme, source folders, xcodeproj, plist, entitlements, and module/imports were updated. **Bundle identifiers and background URLSession identifier were intentionally preserved** to avoid breaking signing, provisioning, and in-flight uploads. Build succeeds (Debug, iOS Simulator). Remaining "WorkerLite" references are either intentional (bundle IDs, URLSession id, historical docs) or harmless (legacy doc text). A quick manual check in Xcode (open project, run, archive) is recommended.

---

## 2. What was renamed

| Category | Change |
|----------|--------|
| **Display name** | "Worker Lite" → **AiStroyka Worker** (Info.plist `CFBundleDisplayName`, permission strings, LoginView title). |
| **Product name** | WorkerLite → AiStroykaWorker (app, tests). |
| **Target names** | WorkerLite → AiStroykaWorker; WorkerLiteTests → AiStroykaWorkerTests; WorkerLiteUITests → AiStroykaWorkerUITests. |
| **Scheme** | WorkerLite → AiStroykaWorker. |
| **Project name** | WorkerLite → AiStroykaWorker. |
| **.xcodeproj** | WorkerLite.xcodeproj → AiStroykaWorker.xcodeproj. |
| **Folders** | ios/WorkerLite → ios/AiStroykaWorker; WorkerLite/ → AiStroykaWorker/; WorkerLiteTests/ → AiStroykaWorkerTests/; WorkerLiteUITests/ → AiStroykaWorkerUITests/. |
| **App entry** | WorkerLiteApp.swift / WorkerLiteApp → AiStroykaWorkerApp.swift / AiStroykaWorkerApp. |
| **App delegate** | WorkerLiteAppDelegate → AiStroykaWorkerAppDelegate; notification name → aiStroykaWorkerPushPayload. |
| **Entitlements file** | WorkerLite.entitlements → AiStroykaWorker.entitlements. |
| **Persistence dir** | Application Support/WorkerLite/ → Application Support/AiStroykaWorker/. |
| **Module / imports** | import WorkerLite → import AiStroykaWorker; @testable import WorkerLite → @testable import AiStroykaWorker. |
| **Test classes** | WorkerLiteTests → AiStroykaWorkerTests; WorkerLiteUITests → AiStroykaWorkerUITests; WorkerLiteUITestsLaunchTests → AiStroykaWorkerUITestsLaunchTests. |
| **Swift file headers** | `//  WorkerLite` → `//  AiStroykaWorker`. |
| **Scheme user state** | xcschememanagement.plist key WorkerLite.xcscheme_^#shared#^_ → AiStroykaWorker.xcscheme_^#shared#^_. |
| **Docs (paths/commands)** | REPORT-PHASE7-1/2/3/4/6 and ios/BUILD.md updated with new open/xcodebuild paths and scheme. |

---

## 3. What was intentionally NOT renamed

| Item | Reason |
|------|--------|
| **PRODUCT_BUNDLE_IDENTIFIER** (app) | Preserve **POTA.WorkerLite** for signing, provisioning, App Store continuity. |
| **PRODUCT_BUNDLE_IDENTIFIER** (tests) | POTA.WorkerLiteTests, POTA.WorkerLiteUITests preserved to avoid reprovisioning. |
| **Background URLSession identifier** | `com.aistroyka.workerlite.uploads` kept so in-flight background uploads and system mapping are not broken. |
| **Historical doc titles** | Phase 7 report titles still say "Worker Lite" where they describe the original scope; body text updated with rename note and current paths. |
| **WorkerAPI.swift filename** | Left as-is (API/service name, not app name). |

---

## 4. Old → New mapping table

See **docs/IOS_RENAME_MAPPING_TABLE.md** for the concise matrix.

---

## 5. Files changed

- **ios/AiStroykaWorker/AiStroykaWorker/** — Info.plist (display name, permission strings); all Swift sources (headers, App/Delegate, persistence paths, notification name); AiStroykaWorker.entitlements (new path/name).
- **ios/AiStroykaWorker/AiStroykaWorkerTests/** — AiStroykaWorkerTests.swift (import, class name).
- **ios/AiStroykaWorker/AiStroykaWorkerUITests/** — AiStroykaWorkerUITests.swift, AiStroykaWorkerUITestsLaunchTests.swift.
- **ios/AiStroykaWorker/AiStroykaWorker.xcodeproj/project.pbxproj** — target/product names, paths, file refs, INFOPLIST_FILE, CODE_SIGN_ENTITLEMENTS, TEST_HOST, TEST_TARGET_NAME, group names, build config comments.
- **ios/AiStroykaWorker/AiStroykaWorker.xcodeproj/xcuserdata/.../xcschememanagement.plist** — scheme key.
- **ios/BUILD.md** — open path, scheme, CLI build command.
- **docs/REPORT-PHASE7-1-WORKER-LITE-IOS.md**, **docs/REPORT-PHASE7-2-WORKER-LITE-HARDENING.md**, **docs/REPORT-PHASE7-3-FIELD-READY.md**, **docs/REPORT-PHASE7-4-BG-UPLOAD-FULL-QUEUE.md**, **docs/REPORT-PHASE7-6-TASKS-HARDENING.md** — rename note and updated open/xcodebuild paths.
- **docs/IOS_RENAME_PRECHECK.md**, **docs/IOS_RENAME_IMPACT_ANALYSIS.md** — pre-rename snapshots (unchanged).
- **docs/IOS_FULL_RENAME_WORKERLITE_TO_AISTROYKAWORKER.md** (this file), **docs/IOS_RENAME_MAPPING_TABLE.md** — new.

---

## 6. Project entities changed

| Entity | Before | After |
|--------|--------|-------|
| Display name | Worker Lite | **AiStroyka Worker** |
| Product name | WorkerLite | AiStroykaWorker |
| Target name (app) | WorkerLite | AiStroykaWorker |
| Target names (tests) | WorkerLiteTests, WorkerLiteUITests | AiStroykaWorkerTests, AiStroykaWorkerUITests |
| Scheme name | WorkerLite | AiStroykaWorker |
| Project name | WorkerLite | AiStroykaWorker |
| .xcodeproj name | WorkerLite.xcodeproj | AiStroykaWorker.xcodeproj |
| Folder names | WorkerLite, WorkerLiteTests, WorkerLiteUITests | AiStroykaWorker, AiStroykaWorkerTests, AiStroykaWorkerUITests |
| Module / imports | WorkerLite | AiStroykaWorker |

---

## 7. Bundle identifier status

- **App:** POTA.WorkerLite — **unchanged**.
- **Unit tests:** POTA.WorkerLiteTests — **unchanged**.
- **UI tests:** POTA.WorkerLiteUITests — **unchanged**.

No changes to Apple Developer portal or provisioning required.

---

## 8. Signing / provisioning status

- Signing identity, team, and entitlements capability links are unchanged.
- CODE_SIGN_ENTITLEMENTS points to AiStroykaWorker/AiStroykaWorker.entitlements (file renamed; content and capabilities unchanged).
- No app groups, push, or keychain identifiers were renamed; no signing flow changes.

---

## 9. Remaining WorkerLite references and why they remain

| Location | Reference | Reason |
|----------|-----------|--------|
| project.pbxproj | PRODUCT_BUNDLE_IDENTIFIER = POTA.WorkerLite (and Tests/UITests) | Intentional: preserve signing/provisioning. |
| BackgroundUploadService / AppDelegate | URLSession identifier `com.aistroyka.workerlite.uploads` | Intentional: avoid breaking in-flight uploads and system mapping. |
| docs (various) | "Worker Lite" in titles or historical scope text | Harmless: phase report names and context; body updated with current paths. |
| docs/IOS_RENAME_*.md | "WorkerLite" in analysis/precheck/mapping | Intentional: documents the rename from WorkerLite. |
| packages/contracts-openapi/dist/openapi.json | "Worker Lite" in summary string | API contract text; optional to change later. |

**Fixed after audit:** Root `ios/AiStroykaWorker/Info.plist` had one permission string still "Worker Lite"; updated to "AiStroyka Worker". `WorkerAPI.swift` doc comment updated to "AiStroyka Worker endpoints". No remaining user-facing "Worker Lite" in iOS source or app plist.

---

## 10. Risks

- **User data:** Persistence moved from `Application Support/WorkerLite/` to `Application Support/AiStroykaWorker/`. Existing installs will not see old data unless migrated; clean installs use new path. Acceptable for rename.
- **Background uploads:** Identifier unchanged; no risk to existing background sessions.
- **Xcode user state:** xcuserdata scheme key updated; if someone has an old workspace state, they may need to re-select the scheme (AiStroykaWorker).

---

## 11. Manual checks to perform in Xcode

1. Open: `open ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`.
2. Confirm no red file references in Project navigator.
3. Select scheme **AiStroykaWorker**, build (⌘B), run on simulator (⌘R).
4. Confirm app title shows **AiStroyka Worker** (home screen and in-app).
5. If using device/signing: confirm signing & capabilities; optionally Archive to validate.
6. Run unit tests: Product → Test (⌘U) or `xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' -only-testing:AiStroykaWorkerTests test`.

---

## 12. Final status

**SAFE_WITH_MANUAL_CHECKS**

- Build: **succeeded** (Debug, generic iOS Simulator).
- Rename: complete for display name, product/target/scheme, project/folders, plist, entitlements, sources, tests, and doc paths/commands.
- Bundle ID and URLSession identifier: preserved by design.
- Recommended: open project in Xcode, run once, and optionally archive to confirm signing and scheme behavior.
