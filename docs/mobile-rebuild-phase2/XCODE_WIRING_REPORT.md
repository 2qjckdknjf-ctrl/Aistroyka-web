# Xcode Wiring Report — Phase 2

**Date:** 2026-03-12

---

## 1. Worker project (AiStroykaWorker.xcodeproj)

| Item | Status |
|------|--------|
| Migrated source files | All added to project (app, Persistence, Services, Views) |
| Shared package | Added as XCLocalSwiftPackageReference (relativePath = ../Shared); target packageProductDependencies = Shared |
| Target membership | All Worker Swift files in AiStroykaWorker target Sources build phase |
| Bundle ID | ai.aistroyka.worker |
| Info.plist | AiStroykaWorker/Info.plist |
| Entitlements | AiStroykaWorker/AiStroykaWorker.entitlements |
| Assets | Assets.xcassets, Preview Content/Preview Assets.xcassets in Resources |
| Schemes | AiStroykaWorker (default) |
| No Manager sources | Confirmed — no Manager target or Manager-only files |

---

## 2. Manager project (AiStroykaManager.xcodeproj)

| Item | Status |
|------|--------|
| Migrated source files | All added (app, Services, Design, Views) |
| Shared package | Added as XCLocalSwiftPackageReference (relativePath = ../Shared); target packageProductDependencies = Shared |
| Target membership | All Manager Swift files in AiStroykaManager target Sources build phase |
| Bundle ID | ai.aistroyka.manager |
| Info.plist | AiStroykaManager/Info.plist |
| Assets | Assets.xcassets in Resources |
| Schemes | AiStroykaManager (default) |
| No Worker sources | Confirmed — no Worker-only files |

---

## 3. Fixes applied

- Duplicate IDs in project.pbxproj resolved: Sources and Resources build phases use distinct IDs (e.g. WRK030, WRK032) so they do not collide with file reference IDs (e.g. WRK121 = ImagePicker.swift).
- Shared package reference: both projects use relative path `../Shared` from the respective project directory.

---

## 4. Openability

- Open Worker: `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`
- Open Manager: `ios/AiStroykaManager/AiStroykaManager.xcodeproj`
- Set Development Team for signing before archive/device run.
