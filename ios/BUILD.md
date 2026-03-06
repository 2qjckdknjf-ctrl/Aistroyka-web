# Worker Lite — Build and run

- **Open:** From repo root: `open ios/WorkerLite/WorkerLite.xcodeproj`. From here: `open WorkerLite/WorkerLite.xcodeproj`.
- **Config:** Copy `Config/Config.example.xcconfig` to `Config/Secrets.xcconfig` (in `ios/Config/` or in project) and set `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Do not commit secrets.
- **Build:** Scheme **WorkerLite** → Product → Build (⌘B). Run on simulator or device (⌘R).
- **CLI:** `cd ios/WorkerLite && xcodebuild -scheme WorkerLite -destination 'generic/platform=iOS Simulator' -configuration Debug build`

See `docs/REPORT-PHASE7-1-WORKER-LITE-IOS.md` for full pilot flow and verification.
