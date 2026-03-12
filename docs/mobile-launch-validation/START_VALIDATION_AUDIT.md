# Start Validation Audit — iOS Launch Validation

**Date:** 2026-03-12  
**Role:** Principal iOS Release Engineer + Mobile Stabilization Lead

---

## 1. Current project structure

```
ios/
  AiStroykaManager/
    AiStroykaManager.xcodeproj
    AiStroykaManager/
      (App, ManagerSessionState, ManagerRootView, Services/, Design/, Views/, Info.plist, Assets.xcassets)
  AiStroykaWorker/
    AiStroykaWorker.xcodeproj
    AiStroykaWorker/
      (App, AppDelegate, AppState, RootView, Persistence/, Services/, Views/, Info.plist, entitlements, Assets, Preview Content)
  Shared/
    Package.swift
    Sources/Shared/
      (APIError, Config, DeviceContext, KeychainHelper, NetworkMonitor, APIClient, Endpoints, AuthService)
  README.md
```

- Two separate Xcode projects; no single project with mixed targets.
- Shared is a Swift package consumed by both apps via local package reference (`../Shared`).

---

## 2. Schemes detected

| Project | Scheme | Target |
|---------|--------|--------|
| AiStroykaWorker.xcodeproj | AiStroykaWorker | AiStroykaWorker (app) |
| AiStroykaManager.xcodeproj | AiStroykaManager | AiStroykaManager (app) |

Both projects report schemes and resolve the Shared package successfully with `xcodebuild -list`.

---

## 3. Shared package wiring status

- **Resolved:** Both projects show `Resolved source packages: Shared: .../ios/Shared @ local`.
- **Dependency:** Each app target has `packageProductDependencies = ( Shared )` and links the Shared framework.
- **Import:** App code uses `import Shared` for APIClient, AuthService, Config, DTOs, etc.
- **Phase 2 fix:** `SyncConflictError` in Shared was given `public init(body:)` so WorkerAPI can throw it.

---

## 4. Current known build issues

- **Phase 2:** Build had failed with `SyncConflictError` initializer inaccessible; fixed in Shared/Endpoints.swift.
- **Destination:** `platform=iOS Simulator,name=iPhone 16` timed out (simulator may not exist or not booted). Use `id=<UUID>` for an available simulator (e.g. iPhone 15) or `generic/platform=iOS Simulator`.
- **Concurrent build:** If "database is locked" appears, run a single build or clean first and retry.
- **Config:** BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY are plist placeholders `$(VAR)`; values must come from xcconfig or Scheme environment or defaults in Config.swift apply at runtime.

---

## 5. Config / secrets / runtime risks

| Risk | Mitigation |
|------|------------|
| Missing BASE_URL / Supabase | Config.swift and AuthService use Bundle/environment; empty Supabase URL causes sign-in to throw a clear error. |
| No xcconfig in repo | Add Config/Secrets.xcconfig (gitignored) or document Scheme env vars; document in CONFIG_AND_ENV_SETUP.md. |
| DEVELOPMENT_TEAM empty | Required for device/archive; set in Xcode for signing. |
| Info.plist $(BASE_URL) | Resolved at build time from build settings; if unset, app still runs and Config falls back to env/Bundle. |

---

## 6. Validation plan

1. **Xcode wiring:** Verify file refs, target membership, Shared dependency, Info.plist paths, bundle IDs, deployment target, build phases (no duplicate IDs).
2. **Config:** Add example xcconfig and document Scheme env vars; ensure fallbacks in Config.swift are safe.
3. **Build:** Run `xcodebuild -scheme AiStroykaWorker -destination 'platform=iOS Simulator,id=<available>' build` and same for AiStroykaManager; fix any compile/link errors.
4. **Simulator launch:** Boot a simulator, install and launch both apps; confirm no immediate crash, login screen appears.
5. **Smoke:** Basic login, home, and navigation flows; document graceful behavior when backend is unavailable.
6. **Shared layer:** Confirm no duplicate shared code in app folders; correct imports; no WorkerLite as primary name.
7. **Naming/legacy:** Confirm app/scheme names; document any remaining WorkerLite references.
8. **Final report:** Summarize build/launch status, required config, remaining blockers, next steps.
