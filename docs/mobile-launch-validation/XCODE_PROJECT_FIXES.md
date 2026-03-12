# Xcode Project Fixes — iOS Launch Validation

**Date:** 2026-03-12  
**Role:** Principal iOS Release Engineer + Mobile Stabilization Lead

---

## Summary

Both projects were verified and fixes were applied at the **code** level (Swift API compatibility), not at the Xcode project file level. No project/scheme/asset reference edits were required; the project wiring was already correct.

---

## 1. Projects verified

| Item | AiStroykaWorker | AiStroykaManager |
|------|-----------------|------------------|
| Project path | `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj` | `ios/AiStroykaManager/AiStroykaManager.xcodeproj` |
| Scheme | AiStroykaWorker | AiStroykaManager |
| Target | AiStroykaWorker (app) | AiStroykaManager (app) |
| Shared dependency | Local package `../Shared` | Local package `../Shared` |
| Info.plist | In target, path correct | In target, path correct |
| Bundle ID | `ai.aistroyka.worker` | `ai.aistroyka.manager` |
| Deployment target | iOS 16.0 | iOS 16.0 |

---

## 2. File references and target membership

- All app Swift files are in the correct groups and belong to the app target.
- No missing file references or orphaned files detected.
- Shared package is referenced as a local Swift package; both apps have `packageProductDependencies = ( Shared )`.

---

## 3. Info.plist paths

- **Worker:** `AiStroykaWorker/Info.plist` — set in target Build Settings (INFOPLIST_FILE).
- **Manager:** `AiStroykaManager/Info.plist` — set in target Build Settings.
- Both use `$(BASE_URL)`, `$(SUPABASE_URL)`, `$(SUPABASE_ANON_KEY)`; resolution is via build settings / xcconfig / Scheme env (see CONFIG_AND_ENV_SETUP.md).

---

## 4. Bundle identifiers and deployment targets

- **Worker:** `ai.aistroyka.worker`, iOS 16.0.
- **Manager:** `ai.aistroyka.manager`, iOS 16.0.
- No changes made.

---

## 5. Signing placeholders

- DEVELOPMENT_TEAM can be unset for simulator-only builds.
- For device/archive: set in Xcode → Signing & Capabilities for each target.

---

## 6. Build settings

- No project-level build setting changes were required for validation.
- Swift version: 5. Supported platforms: iOS.

---

## 7. Code-level fixes applied (not project edits)

These fixes were required for **build success** and were applied in source:

| Location | Issue | Fix |
|----------|--------|-----|
| AiStroykaWorker: RootView.swift | `.onChange(of:initial:_:)` (two-arg) is iOS 17+ | Switched to single-value `.onChange(of:) { value in }` (iOS 16). |
| AiStroykaWorker: HomeContainerView.swift | Same `.onChange` API | Same fix. |
| AiStroykaWorker: ReportCreateView.swift | (1) `let` inside ViewBuilder causing type-check timeout; (2) iOS 17+ `.onChange` | Extracted `canSubmitReport` computed property; converted `.onChange` to single-value form. |
| AiStroykaManager: NotificationsView.swift | `.onChange(of:initial:_:)` iOS 17+ | Converted to single-value `.onChange(of: showDevices) { expanded in ... }`. |

---

## 8. Assets and resources

- Worker: Assets.xcassets, entitlements, Preview Content present and referenced.
- Manager: Assets.xcassets, Info.plist present. No missing resource errors after fixes.

---

## 9. Swift package linkage and scheme visibility

- Shared package resolves for both projects (`xcodebuild -list` shows resolved packages).
- Schemes are visible and build the correct app target.
- No Swift package linkage changes were made.

---

## 10. Conclusion

- **Project wiring:** No Xcode project file edits were needed; structure is correct.
- **Fixes applied:** Swift source only (iOS 16–compatible `.onChange`, ReportCreateView type-check fix).
- Both apps build successfully after these code changes.
