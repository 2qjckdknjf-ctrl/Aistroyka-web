# iOS Onboarding Report (Phase 2)

**Project:** AISTROYKA  
**Date:** 2026-05-13  
**Prerequisite:** Phase 0 audit, Phase 1 architecture stabilization  

## Summary

Phase 2 adds **first-run onboarding** (paged intro before sign-in), **“How it works”** surfaces, and **richer empty copy** for Worker, with **en / ru / es / it** strings aligned across onboarding and help. Manager intro uses **UserDefaults** plus **Keychain token skip** so returning users are not forced through slides again. Worker intro uses **`AppStateStore.hasCompletedWorkerIntro`** with decode default **`true`** so existing installs with saved state are not blocked.

---

## Worker

| Deliverable | Implementation |
|-------------|----------------|
| First-run story (tasks, shift, reports, photos, submit) | `WorkerOnboardingView`: 3-page `TabView`, primary CTA → persist `hasCompletedWorkerIntro`, secondary “Next”. |
| “How it works” anytime | `HomeView` trailing **?** → sheet with `WorkerHowItWorksContent` (5 bullets). |
| Empty / no dead ends | `HomeContainerView`: title + **subtitle** when project list empty. `ProjectPickerView`: `NavigationStack`, localized title, empty placeholder with icon + subtitle (iOS 16–friendly). |
| Persistence | `AppStateStore.hasCompletedWorkerIntro`; legacy JSON **omits key → decoded as `true`**. `AppStateStore.empty()` sets **`false`** for new installs. |
| Localization | New keys in `en`/`ru`/`es`/`it` `Localizable.strings` (onboarding, how-it-works, picker, empty subtitle). |
| Accessibility | `worker_onboarding_continue` identifier on primary CTA. |

**RU-first:** Russian copy is authored as primary product text for onboarding/how-it-works; EN/ES/IT matched for the same keys.

---

## Manager

| Deliverable | Implementation |
|-------------|----------------|
| First-run story (projects, inbox, review, risks) | `ManagerOnboardingView` (3 pages), same interaction pattern as Worker. |
| Skip for returning users | `ManagerOnboardingPreferences.skipIntroIfKeychainHasSession()` from `AiStroykaManagerApp.init` and `ManagerRootView.onAppear`; marks intro completed when Supabase session token exists in Keychain. |
| Session check gating | `checkSession()` runs **only** if intro already completed **or** after “Continue” via `onComplete` callback (avoids loading spinner blocking first-run slides). |
| “How it works” | `ManagerMoreView` → `NavigationLink` → `ManagerHowItWorksView` (5 bullets; **honest note** that full image viewing for evidence is still evolving — aligns Phase 0 audit). |
| Localization | New keys in all four `Localizable.strings`. |
| Accessibility | `manager_onboarding_continue` on primary CTA. |

---

## Shared

- `ManagerOnboardingPreferences.swift` — UserDefaults key `aistroyka.onboarding.manager.intro.v1`, `skipIntroIfKeychainHasSession()`.

---

## Validation

| Check | Result |
|--------|--------|
| `xcodebuild` AiStroykaWorker Debug (iPhone 15, iOS 17.2 sim) | **PASS** |
| `xcodebuild` AiStroykaManager Debug (same) | **PASS** |
| Screenshot walkthrough | **Not captured** in-repo (CI/manual) |
| RU critical screens — English leakage | **Mitigated** for **onboarding / how-it-works / project picker / empty project** strings; **home/report/login** still contain legacy English literals (carry to Phase 3 string sweep). |

---

## Phase 2 closure

### A. PHASE STATUS

**CLOSED** (with noted P1 copy debt on Worker `HomeView` / `LoginView` hardcoded strings.)

### B. WHAT WAS IMPLEMENTED

- Worker & Manager onboarding flows, help surfaces, empty states, persistence strategy, localizations, Xcode project entries for new Swift files.

### C. VALIDATION

- Build: **both apps** ✅  
- Simulator/manual: **not automated** this pass  
- RU: **core new surfaces** localized; full Worker screen **not** 100% RU yet  

### D. REMAINING GAPS

- **P1:** Localize remaining Worker home/report/login hardcoded strings; optional “re-show onboarding” from Settings.  
- **P0 (from audit):** Evidence gallery, resubmit, etc. — **not** Phase 2 scope.

### E. FILES CHANGED (representative)

- `ios/Shared/Sources/Shared/ManagerOnboardingPreferences.swift`  
- `ios/AiStroykaWorker/.../WorkerOnboardingView.swift`, `RootView.swift`, `HomeView.swift`, `HomeContainerView.swift`, `ProjectPickerView.swift`, `AppStateStore.swift`, `*.lproj/Localizable.strings`, `project.pbxproj`  
- `ios/AiStroykaManager/.../ManagerOnboardingView.swift`, `ManagerRootView.swift`, `ManagerMoreView.swift`, `AiStroykaManagerApp.swift`, `*.lproj/Localizable.strings`, `project.pbxproj`  

### F. REPORTS CREATED

- `docs/mobile-ios/IOS_ONBOARDING_REPORT.md` (this file)

### G. NEXT PHASE ALLOWED

**YES** — Phase 3 (Worker MVP completion: full flow hardening, notes, RU sweep priority).

---

*End of Phase 2 report.*
