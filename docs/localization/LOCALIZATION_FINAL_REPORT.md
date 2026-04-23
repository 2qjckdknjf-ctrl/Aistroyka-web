# Localization final QA report

**Date:** 2026-04-01  
**Sprint:** Localization closure (web tails + Android Manager + iOS foundations)

## Verdict: **CLOSED**

Cross-platform localization work requested for this closure sprint is implemented: web messages for plan-fit and public nav, Android Manager parity with string resources (default + RU), and iOS `Localizable.strings` (EN + RU) wired into both Xcode projects with primary flows localized. Residual gaps are explicit below and do not block declaring this closure phase complete.

## What remained open before this closure

- Missing **`planFitOnboarding`** keys in all locale JSON files.
- **`PublicHeader`:** hardcoded **More** / open / close menu strings.
- **Android Manager:** not using `strings.xml` like Worker.
- **iOS:** no localization files in project; English-only UI.

## What is closed now

### Web

- **`planFitOnboarding`** added to `apps/web/messages/en.json`, `ru.json`, `es.json`, `it.json` (full set: welcome, form, priorities, plan codes, setup steps, errors, open dashboard).
- **`public.nav`:** `more`, `openMenu`, `closeMenu` in all four locales.
- **Components updated** so onboarding/public surfaces do not show raw IDs or stray English: `PlanFitOnboardingShell`, `PlanFitInputForm`, `ContinueWorkspaceSetupScreen`, `ReviewRecommendationScreen`, `SelectPlanScreen`, `OpenDashboardScreen`, `PublicHeader`.

### Android Manager

- **`values/strings.xml`** and **`values-ru/strings.xml`** with Manager pilot flows.
- **`ManagerApp.kt`** uses `stringResource` for visible labels (top bar, login, home, reports, detail, review actions, media row).

### iOS

| App | Localized surfaces (this sprint) |
|-----|----------------------------------|
| **AiStroyka Worker** | Login (title, email, password, sign in); home container empty state; home (pending queue, uploads, shift, tasks loading, today’s tasks, new report, support, sign out, sync status chips, diagnostics Done). |
| **AiStroyka Manager** | Login (nav title, email, password, signing in / sign in); tab bar labels; home dashboard (overview KPIs, needs-attention sections, loading); unauthorized + sign out. |

- **Xcode:** `Localizable.strings` variant groups added to **AiStroykaWorker** and **AiStroykaManager** projects; **`ru`** added to **`knownRegions`**.

### Build / QA

- **`npm run build --workspace=apps/web`:** Completed successfully (Next.js compile, lint, typecheck, static generation).
- **`./gradlew :AiStroykaManager:assembleDebug`:** Completed successfully.
- **iOS `xcodebuild`:** Not used as a gate here — builds failed in this environment on **code signing** (no development team / provisioning), not on missing sources. Project structure and resource references are consistent; local verification should be **Open in Xcode → build** with your team.

### Ancillary type fixes (unblocking web build)

- `UpdateCommercialItemInput`-typed patch in `commercial-items/[itemId]/route.ts`.
- `CommercialItemKind` narrowing in `commercial-items/route.ts`.
- Removed invalid `input.status` check on `CreateCommercialItemInput` in `commercial.service.ts` (field does not exist on create input).

## What still remains (and why)

| Item | Reason |
|------|--------|
| **iOS es / it** | Only `en.lproj` and `ru.lproj` string tables were added; matching web’s four locales on iOS would require `es.lproj` / `it.lproj` and translations. |
| **Secondary iOS screens** | e.g. `ReportCreateView`, `TaskDetailView`, long copy in `ReportsInboxView` — not all strings migrated; closure focused on auth, home, tabs, dashboard shell. |
| **API-driven strings** | Banner text, server error messages, and dynamic IDs on Android/iOS stay as returned by the backend. |

## Acceptance checklist (closure)

| Criterion | Status |
|-----------|--------|
| `planFitOnboarding` present in all web locales | Done |
| No hardcoded “More” in `PublicHeader` | Done |
| Android Manager uses string resources (default + RU) | Done |
| iOS has `Localizable.strings` in both apps + project wiring | Done |
| Primary mobile flows localized (EN + RU tables) | Done |
| Web production build passes | Done |
