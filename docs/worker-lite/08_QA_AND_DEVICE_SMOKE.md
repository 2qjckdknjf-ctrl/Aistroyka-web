# Worker Lite — QA and Device Smoke

**Date:** 2025-03-11

## 1. Static Validation

- Project structure and target membership corrected (DiagnosticsView in target; HomeView appState).
- Bundle ID and build file references normalized (WorkerLite project).
- Full Xcode build not re-run to completion in this environment (simulator destination timeout; generic build had failed before fixes). **Manual step:** Build in Xcode (⌘B) with scheme AiStroykaWorker and a simulator.

## 2. Unit / UI Tests

- AiStroykaWorkerTests and AiStroykaWorkerUITests exist; not run in this session. To run:
  - Xcode: Product → Test (⌘U), or
  - `xcodebuild -scheme AiStroykaWorker -destination 'platform=iOS Simulator,name=iPhone 16' test`

## 3. Build Commands (Reference)

```bash
# Simulator build
cd ios/AiStroykaWorker
xcodebuild -scheme AiStroykaWorker -destination 'platform=iOS Simulator,name=iPhone 16' -configuration Debug build

# Device build (replace with your destination)
xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS' -configuration Debug build

# Archive (for distribution)
xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS' -configuration Release archive -archivePath build/AiStroykaWorker.xcarchive
```

## 4. Device Smoke Checklist (Pilot)

Use this on a real device with a pilot backend and valid Supabase + BASE_URL.

- [ ] **Login** — Enter email/password; sign in succeeds; home (project list or single project) appears.
- [ ] **App reopen with session restore** — Kill app; reopen; still logged in; home visible without re-entering credentials.
- [ ] **Fetch tasks** — Select project; "Today's tasks" load (or empty list); no crash.
- [ ] **Start/end day** — Start shift; status shows "Shift in progress"; End shift; status updates.
- [ ] **Create report** — New report → Create report; draft id appears.
- [ ] **Attach photo** — Before photo (camera or library); After photo; both show attached/upload state.
- [ ] **Upload media** — Pending uploads complete (or "Resume uploads" if needed); no permanent failure without feedback.
- [ ] **Submit report** — Submit report; "Submitted" or success state; report no longer in draft.
- [ ] **Logout / login again** — Sign out; login screen; sign in again; home visible.
- [ ] **Behavior without network** — Turn off Wi‑Fi/cellular; sync status shows Offline; actions that need network show error or queue; no crash.
- [ ] **Push registration (if enabled)** — After adding Push Notifications capability and configuring backend, register device; backend receives token; optional: send test notification.
