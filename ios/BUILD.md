# Worker Lite — Build and run

- **Open:** `open WorkerLite.xcodeproj` (from this directory) or open `ios/WorkerLite.xcodeproj` from repo root.
- **Config:** Copy `Config/Config.example.xcconfig` to `Config/Secrets.xcconfig` and set `BASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Do not commit secrets.
- **Build:** Scheme **WorkerLite** → Product → Build (⌘B). Run on simulator or device (⌘R).
- **CLI:** `xcodebuild -scheme WorkerLite -destination 'generic/platform=iOS Simulator' -configuration Debug build`

See `docs/REPORT-PHASE7-1-WORKER-LITE-IOS.md` for full pilot flow and verification.
