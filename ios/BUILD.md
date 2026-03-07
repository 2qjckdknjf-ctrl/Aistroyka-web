# AiStroyka iOS — Build and run

- **Open:** From repo root: `open ios/AiStroykaWorker/AiStroykaWorker.xcodeproj`. From here: `open AiStroykaWorker/AiStroykaWorker.xcodeproj`.
- **Config:** Copy `Config/Config.example.xcconfig` to `Config/Secrets.xcconfig` (in `ios/Config/` or in project) and set `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Do not commit secrets.

**Worker app (field)**
- **Build:** Scheme **AiStroykaWorker** → Product → Build (⌘B). Run on simulator or device (⌘R).
- **CLI:** `cd ios/AiStroykaWorker && xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' -configuration Debug build`
- See `docs/REPORT-PHASE7-1-WORKER-LITE-IOS.md` for full pilot flow and verification.

**Manager app**
- **Build:** Scheme **AiStroyka Manager** → Product → Build (⌘B). Run on simulator or device (⌘R).
- **CLI:** `cd ios/AiStroykaWorker && xcodebuild -scheme "AiStroyka Manager" -destination 'generic/platform=iOS Simulator' -configuration Debug build`
- See `docs/ios-manager/REPORT-IOS-MANAGER-FINAL.md` for architecture and integration.
