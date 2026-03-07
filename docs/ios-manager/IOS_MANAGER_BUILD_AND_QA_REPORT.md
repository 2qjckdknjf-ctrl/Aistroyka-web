# iOS Manager — Build and QA Report

**Date:** 2026-03-07

---

## Manager build status

- **Target:** AiStroyka Manager  
- **Scheme:** AiStroyka Manager  
- **Command:** `cd ios/AiStroykaWorker && xcodebuild -scheme "AiStroyka Manager" -destination 'generic/platform=iOS Simulator' -configuration Debug build`  
- **Result:** ✅ **BUILD SUCCEEDED**

## Worker regression status

- **Target:** AiStroykaWorker  
- **Command:** `cd ios/AiStroykaWorker && xcodebuild -scheme AiStroykaWorker -destination 'generic/platform=iOS Simulator' -configuration Debug build`  
- **Result:** ✅ **BUILD SUCCEEDED** (no regression)

## Validated flows

- Manager: Compile and link; app entry (AiStroykaManagerApp), ManagerRootView, login, tab shell, Projects list (load from API), placeholder screens for Tasks, Reports, Team, AI, More, Settings.
- Worker: Unchanged; still builds and uses same shared sources (Core, Networking, AuthService) without conflict.
- Imports and target membership: Manager target compiles only Manager sources + shared sources; Worker target unchanged. No accidental file leakage.

## Known issues

- **x-client:** APIClient sends `ios_lite` for both apps. Backend may later expect `ios_manager` for manager routes; add when specified.
- **Role gating:** Manager allows any logged-in user; backend role (owner/admin/member) not yet consumed.
- **Previews:** Manager views are not run in SwiftUI previews in this pass; can be added later.
- **Entitlements:** Manager target has no custom entitlements file (no push, no keychain groups beyond default). Add if needed for push or shared keychain.

## Blockers

- None for build and basic run. For production: configure BASE_URL/SUPABASE in Secrets.xcconfig or scheme env; ensure backend allows manager routes for the same JWT.

## Recommended next steps

1. Add `x-client: ios_manager` when backend documents it.
2. Wire GET /api/v1/me or tenant context to ManagerSessionState for role gating.
3. Implement ManagerAPI.workers() and wire Team tab.
4. Add GET /api/v1/ops/overview (and org metrics) to ManagerAPI and Home dashboard KPIs.
5. Add report detail and task detail screens with GET by id.
6. Add design system components (KPI card, empty state, etc.) and refactor dashboard.
