# Build Validation Report — iOS Launch Validation

**Date:** 2026-03-12  
**Role:** Principal iOS Release Engineer + Mobile Stabilization Lead

---

## 1. Commands used

```bash
# Simulator destination (iPhone 15) — use an available device ID from `xcrun simctl list devices available`
DEST='platform=iOS Simulator,id=F807605D-F0FA-45DA-961E-B1AC69A27A91'

# AiStroykaWorker
cd ios/AiStroykaWorker
xcodebuild -scheme AiStroykaWorker -destination "$DEST" -configuration Debug build

# AiStroykaManager
cd ios/AiStroykaManager
xcodebuild -scheme AiStroykaManager -destination "$DEST" -configuration Debug build
```

---

## 2. Errors encountered and fixes applied

### AiStroykaWorker

| File | Error / symptom | Fix |
|------|------------------|-----|
| RootView.swift | `.onChange(of: appState.isLoggedIn) { _, loggedIn in ... }` — two-parameter `onChange` is iOS 17+ | Replaced with `.onChange(of: appState.isLoggedIn) { loggedIn in ... }` (iOS 16–compatible). |
| HomeContainerView.swift | `.onChange(of: selectedProject?.id) { _, new in ... }` — same API | Replaced with `.onChange(of: selectedProject?.id) { new in ... }`. |
| ReportCreateView.swift | (1) “The compiler is unable to type-check this expression in reasonable time”; (2) `let beforeAttachDone` / `let afterAttachDone` inside ViewBuilder; (3) `.onChange(..., { _, new in })` | Extracted `canSubmitReport` computed property; removed `let` from body; converted all `.onChange` in file to single-value form. |

### AiStroykaManager

| File | Error / symptom | Fix |
|------|------------------|-----|
| NotificationsView.swift | `.onChange(of: showDevices) { _, expanded in ... }` — iOS 17+ API | Replaced with `.onChange(of: showDevices) { expanded in ... }`. |

---

## 3. Final build status

| App | Status | Notes |
|-----|--------|--------|
| **AiStroykaWorker** | **BUILD SUCCEEDED** | After RootView, HomeContainerView, ReportCreateView fixes. |
| **AiStroykaManager** | **BUILD SUCCEEDED** | After NotificationsView fix. |

---

## 4. Environment

- **Xcode:** Command-line build; target SDK iphonesimulator17.2; deployment target iOS 16.0 for both apps.
- **Shared:** Resolved as local Swift package; no package build failures.
- **Destination:** iPhone 15 simulator (id=F807605D-F0FA-45DA-961E-B1AC69A27A91). Using `name=iPhone 16` had caused timeouts when that simulator was not available.

---

## 5. Conclusion

Both AiStroykaWorker and AiStroykaManager **build successfully** with the applied Swift source fixes. No fake success; builds are reproducible with the commands above.
