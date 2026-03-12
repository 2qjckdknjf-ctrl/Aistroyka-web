# Build and Runtime Config Validation — iOS Local Configuration

**Date:** 2026-03-12  
**Role:** Principal iOS Configuration Engineer

---

## 1. Build validation

After wiring **ios/Config/Secrets.xcconfig** into both projects:

- **AiStroykaWorker:** `xcodebuild -scheme AiStroykaWorker -destination 'platform=iOS Simulator,id=F807605D-F0FA-45DA-961E-B1AC69A27A91' -configuration Debug build` → **BUILD SUCCEEDED** (clean build confirmed).
- **AiStroykaManager:** Same destination, scheme AiStroykaManager → **BUILD SUCCEEDED**.

No compile or link errors; xcconfig is found and applied.

---

## 2. Runtime config presence

- **Info.plist (Worker app bundle):** After clean build, plutil shows BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY populated from Secrets.xcconfig (BASE_URL and SUPABASE_URL with escaped slashes in xcconfig; values present in built plist).
- **Config.swift:** Reads from Bundle first; with these keys set in the app’s Info.plist, BASE_URL, supabaseURL, and supabaseAnonKey will not fall back unexpectedly when a real value was wired.
- **Auth path:** SUPABASE_URL and SUPABASE_ANON_KEY are available for AuthService/sign-in; empty Supabase config would trigger the existing “Supabase URL not configured” error.

---

## 3. App startup

- No code changes were made to app startup. With config in Info.plist, startup should not be broken; Shared Config and AuthService use the same paths as before. Simulator launch was not run in this environment; manual run in Xcode is recommended to confirm login and API connectivity.

---

## 4. Manual launch steps (after config)

1. Open **ios/AiStroykaWorker/AiStroykaWorker.xcodeproj** or **ios/AiStroykaManager/AiStroykaManager.xcodeproj** in Xcode.
2. Ensure **ios/Config/Secrets.xcconfig** exists (copy from Secrets.xcconfig.example and set SUPABASE_ANON_KEY if needed).
3. Select scheme AiStroykaWorker or AiStroykaManager and an iOS simulator (e.g. iPhone 15).
4. Run (⌘R). Confirm app launches, login screen appears, and sign-in works when backend/Supabase are reachable.
