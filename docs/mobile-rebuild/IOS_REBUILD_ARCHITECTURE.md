# iOS Rebuild Architecture

**Date:** 2026-03-12  
**Project:** AISTROYKA — four separate mobile apps

---

## 1. Target layout

```
ios/
  AiStroykaManager/
    AiStroykaManager.xcodeproj
    AiStroykaManager/
      AiStroykaManagerApp.swift
      ManagerRootView.swift
      Info.plist
  AiStroykaWorker/
    AiStroykaWorker.xcodeproj
    AiStroykaWorker/
      AiStroykaWorkerApp.swift
      WorkerRootView.swift
      Info.plist
  Shared/
    Package.swift
    Sources/Shared/
      APIError.swift
      Config.swift
  README.md
```

- **Two separate Xcode projects** (one per app). No single project with two targets; no WorkerLite as primary name.
- **One Swift package** (`Shared`) for reusable platform code (API types, config, auth helpers). Both apps add Shared as a local package dependency.

---

## 2. Naming and identifiers

| App              | Display name      | Product/target name  | Bundle identifier   |
|------------------|-------------------|----------------------|---------------------|
| AiStroykaManager | AiStroyka Manager | AiStroykaManager     | ai.aistroyka.manager |
| AiStroykaWorker  | AiStroyka Worker  | AiStroykaWorker      | ai.aistroyka.worker |

- Schemes: **AiStroykaManager**, **AiStroykaWorker** (match target names).
- No **WorkerLite** in project/target/scheme names; legacy bundle ID `POTA.WorkerLite` can be preserved for existing installs and documented in legacy report.

---

## 3. Separate app structures

- **AiStroykaManager:** Own Info.plist, assets, entitlements. Entry: `AiStroykaManagerApp.swift` → `ManagerRootView` (login or tab shell).
- **AiStroykaWorker:** Own Info.plist, assets, entitlements. Entry: `AiStroykaWorkerApp.swift` → `WorkerRootView` (login or home/tasks/report shell).
- **Shared:** Swift package; no UI. Used by both apps for Core/Networking/Auth types and helpers.

---

## 4. Shared iOS layer

- **Location:** `ios/Shared/` (Swift Package).
- **Contents (bootstrap):** `APIError`, `Config`. To be extended with: KeychainHelper, DeviceContext, NetworkMonitor, APIClient, Endpoints (DTOs), AuthService.
- **Consumption:** In Xcode, File → Add Package Dependencies → Add Local → select `ios/Shared`. Link Shared to both app targets.

---

## 5. Assets and config

- Each app has its own **Assets.xcassets** (add when needed) and **Info.plist**.
- **Secrets/config:** Use xcconfig (e.g. `Config/Secrets.xcconfig`, gitignored) or Scheme environment for `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`; Shared `Config.apiBaseURL` can read from environment or Info.plist.

---

## 6. Openability

- Open **AiStroykaManager**: open `ios/AiStroykaManager/AiStroykaManager.xcodeproj`.
- Open **AiStroykaWorker**: open `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`.
- Set **Development Team** for signing. Add **Shared** as local package to each project if not already linked.

---

## 7. Migration from archive

- Previous code (Worker + Manager in one project) is in `ios/Архив.zip`.
- **Migration path:** Extract archive; move Worker-specific sources into `ios/AiStroykaWorker/`, Manager-specific into `ios/AiStroykaManager/`, shared into `ios/Shared/Sources/Shared/`; then create or adjust two separate Xcode projects so each app builds standalone. See `CODE_MIGRATION_REPORT.md`.
