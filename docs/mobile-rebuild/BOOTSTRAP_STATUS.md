# Bootstrap Status

**Date:** 2026-03-12  
**Project:** AISTROYKA — four apps

---

## 1. iOS AiStroykaManager

| Item | Status |
|------|--------|
| Project | ✅ AiStroykaManager.xcodeproj created |
| Entry | ✅ AiStroykaManagerApp.swift (@main) |
| Root shell | ✅ ManagerRootView (login vs ManagerTabShell) |
| Login | ✅ ManagerLoginView placeholder (Sign In button) |
| Tabs | ✅ ManagerTabShell: Home, Projects, Tasks, Reports, More |
| Info.plist | ✅ CFBundleDisplayName "AiStroyka Manager", bundle id ai.aistroyka.manager |

---

## 2. iOS AiStroykaWorker

| Item | Status |
|------|--------|
| Project | ✅ AiStroykaWorker.xcodeproj created |
| Entry | ✅ AiStroykaWorkerApp.swift (@main) |
| Root shell | ✅ WorkerRootView (login vs WorkerHomeShell) |
| Login | ✅ WorkerLoginView placeholder |
| Home/tasks/report shell | ✅ WorkerHomeShell: Tasks, Report, More tabs |
| Info.plist | ✅ CFBundleDisplayName "AiStroyka Worker", bundle id ai.aistroyka.worker |

---

## 3. Android AiStroykaManager

| Item | Status |
|------|--------|
| Module | ✅ :AiStroykaManager application module |
| Entry | ✅ MainActivity → ManagerApp() |
| Root | ✅ ManagerApp Compose (placeholder "AiStroyka Manager" screen) |
| Manifest | ✅ applicationId ai.aistroyka.manager, app_name |

---

## 4. Android AiStroykaWorker

| Item | Status |
|------|--------|
| Module | ✅ :AiStroykaWorker application module |
| Entry | ✅ MainActivity → WorkerApp() |
| Root | ✅ WorkerApp Compose (placeholder "AiStroyka Worker" screen) |
| Manifest | ✅ applicationId ai.aistroyka.worker, app_name |

---

## 5. Summary

All four app entry points exist and are recognizable as separate products. iOS has login + tab placeholders; Android has a single Compose screen per app. Next: wire real auth, navigation, and API; migrate full iOS logic from archive into the new structure.
