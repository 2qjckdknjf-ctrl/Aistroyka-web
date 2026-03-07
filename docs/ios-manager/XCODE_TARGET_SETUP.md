# AiStroyka Manager — Xcode Target Setup

**Date:** 2026-03-07

---

## Workspace / project choice

- **Workspace:** Single-project workspace (no separate `.xcworkspace` file). Open `ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`.
- **Project:** `AiStroykaWorker.xcodeproj` (path `ios/AiStroykaWorker/`). Same project hosts both Worker and Manager apps.

## New target

| Item | Value |
|------|--------|
| **Target name** | AiStroyka Manager |
| **Product name** | AiStroyka Manager |
| **Scheme name** | AiStroyka Manager (auto-created; select in Xcode scheme dropdown) |
| **Bundle identifier** | `ai.aistroyka.manager` |
| **Info.plist** | `AiStroykaManager/Info.plist` |
| **Assets** | `AiStroykaManager/Assets.xcassets` |
| **Entry point** | `AiStroykaManagerApp.swift` (@main) |

## Plist / config

- **Info.plist:** Custom (no generate). Keys: `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CFBundleDisplayName` = "AiStroyka Manager", launch screen, orientations.
- **Build settings:** Base configuration from `Config/Secrets.xcconfig` (same as Worker). `INFOPLIST_FILE` = `AiStroykaManager/Info.plist`.
- **Signing:** Automatic, same development team as Worker.

## Target membership

- **Manager-only:** All files under `AiStroykaManager/` (app entry, ManagerSessionState, ManagerRootView, Views/*).
- **Shared (both targets):** Core (APIError, Config, DeviceContext, KeychainHelper, NetworkMonitor), Networking (APIClient, Endpoints), AuthService. These files live under `AiStroykaWorker/` and are included in the Manager target’s Compile Sources.
- **Worker-only:** Remaining AiStroykaWorker sources (WorkerAPI, persistence, upload, push, Worker views).

## Signing notes

- CODE_SIGN_STYLE = Automatic, DEVELOPMENT_TEAM = 43A4KW5BKB.
- For distribution, add a separate App ID for `ai.aistroyka.manager` in the Apple Developer portal and use the same or a separate provisioning profile.

## Risks

- **Accidental shared edit:** Changing a shared file (e.g. APIClient) affects both apps; test both after edits.
- **x-client header:** APIClient currently sends `x-client: ios_lite`. Manager should send `ios_manager` when backend supports it; document and add later (compile flag or runtime).
- **Config path:** Both targets use `../Config/Secrets.xcconfig`. Ensure Secrets.xcconfig exists when building (or set env in scheme).
