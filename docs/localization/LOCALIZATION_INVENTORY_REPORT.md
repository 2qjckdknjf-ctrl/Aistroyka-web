# Localization inventory — Aistroyka

**Date:** 2026-04-01 (updated — closure sprint)  
**Scope:** Web (Next.js + next-intl), Android (Compose + `strings.xml`), iOS (`Localizable.strings` + `NSLocalizedString`).

## Supported locales (web)

| Locale | Files |
|--------|--------|
| `ru` (default) | `apps/web/messages/ru.json` |
| `en` | `apps/web/messages/en.json` |
| `es` | `apps/web/messages/es.json` |
| `it` | `apps/web/messages/it.json` |

Routing: `apps/web/i18n/routing.ts` — `locales: ["ru", "en", "es", "it"]`, `defaultLocale: "ru"`.

## What was open before closure

- **`planFitOnboarding`:** Components used `useTranslations("planFitOnboarding")` but the namespace was missing from all four JSON files (risk of raw keys).
- **`PublicHeader`:** Mobile section label **“More”** and sr-only **Open/Close menu** were hardcoded English.
- **Android Manager:** Only `app_name` in `strings.xml`; `ManagerApp.kt` used hardcoded English for login, reports, detail.
- **iOS:** No `Localizable.strings` in Xcode projects; Worker and Manager UIs were hardcoded English.

## What is closed now

### Web

- **`planFitOnboarding`:** Full namespace added to `en`, `ru`, `es`, `it` (form options, setup steps, CTAs, plan code labels, validation/errors, open-dashboard copy).
- **`public.nav`:** Added `more`, `openMenu`, `closeMenu` in all four locales; `PublicHeader` uses them.
- **Plan-fit UI:** Hardcoded strings removed from `PlanFitOnboardingShell`, `PlanFitInputForm`, `ContinueWorkspaceSetupScreen`, `ReviewRecommendationScreen`, `OpenDashboardScreen`; plan names use `planCode_*` keys (replacing inline `PLAN_CODE_LABELS` in those screens).

### Android Manager

- **`values/strings.xml`:** All visible strings for `ManagerApp.kt` flows (login, home, reports list, report detail, media row).
- **`values-ru/strings.xml`:** Russian strings aligned with Worker terminology (почта, войти, отчёты, etc.).
- **`ManagerApp.kt`:** Uses `stringResource(R.string.*)` for those flows.

### iOS

- **`Localizable.strings`:** `en.lproj` + `ru.lproj` for **AiStroykaWorker** and **AiStroykaManager** (see paths below).
- **Xcode:** `PBXVariantGroup` + Resources build phase + `knownRegions` include `ru` in both `.xcodeproj` files.
- **Swift:** `NSLocalizedString` / `String(format:)` wired for primary surfaces:
  - **Worker:** `LoginView`, `HomeContainerView`, `HomeView` (queue, shift, tasks, sync labels, toolbar Done).
  - **Manager:** `ManagerLoginView`, `ManagerTabShell`, `HomeDashboardView`, `ManagerUnauthorizedView`.

### iOS limitation (by design this sprint)

- Only **English + Russian** string tables are in the repo. For device language **es** / **it**, iOS will fall back to **English** until `es.lproj` / `it.lproj` are added.

## Paths (reference)

| Area | Location |
|------|-----------|
| Web messages | `apps/web/messages/*.json` |
| Android Worker | `android/AiStroykaWorker/src/main/res/values/strings.xml`, `values-ru/strings.xml` |
| Android Manager | `android/AiStroykaManager/src/main/res/values/strings.xml`, `values-ru/strings.xml` |
| iOS Worker strings | `ios/AiStroykaWorker/AiStroykaWorker/en.lproj/Localizable.strings`, `ru.lproj/Localizable.strings` |
| iOS Manager strings | `ios/AiStroykaManager/AiStroykaManager/en.lproj/Localizable.strings`, `ru.lproj/Localizable.strings` |

## CTA / “demo” audit (marketing)

Unchanged from prior sprint: primary **Launch pilot** (`launchPilot`); demo-style marketing CTAs removed; AI demo page uses “sample” / analysis wording.

## Quality notes

- ES/IT web JSON parity maintained when injecting `planFitOnboarding` and nav keys.
- Deep iOS screens (e.g. `ReportCreateView`, full `ReportsInboxView` body copy) may still contain English strings; closure targeted **main visible** flows first.
