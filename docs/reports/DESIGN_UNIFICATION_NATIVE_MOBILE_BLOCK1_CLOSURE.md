# Design Unification Block 1 — Native Mobile Closure (Corrective Pass)

**Date:** 2026-07-25  
**Scope:** iOS Manager/Worker + Android Manager/Worker brand foundation only (no `apps/web` production edits, no commit/PR/deploy).  
**Canonical visual reference:** `apps/web/app/design-tokens.css` (`--aistroyka-*`).  
**Evidence root (local, gitignored):** `.evidence/design-unification-block1-pass2/`  
**Verdict overall:** **YES** — locally controllable Block-1 corrective defects closed; builds/tests/drift green; per-target DesignPreview matrix captured and visually inspected (not byte-only).

---

## 1. Corrective defects → status

| # | Defect | Status | Evidence / fix |
|---|--------|--------|----------------|
| 1 | Drift gate false PASS (Swift shorthand / system colors) | **PASS** | Expanded `scripts/mobile/check-mobile-brand-drift.mjs` + `--self-test` (15 reject + 6 allow). Feature hits replaced with semantic tokens. Gate: **PASS**. |
| 2 | Evidence only entry/login/first-run; Android login was guide overlay | **PASS** | Deterministic `-DesignPreview` / `design_preview` gallery (no Release auth bypass). Separate `first_run` vs clean `login`. Full matrix below. |
| 3 | Invalid iOS a11y / target contamination | **PASS** | Isolated sim `779B2896-…`, uninstall peer app + reboot between targets; identity overlay `design_preview_app_identity`. A11y via `-DesignPreviewA11y` → `.dynamicTypeSize(.accessibility3)`. Worker push prompt skipped when `-DesignPreview` present. Prior contaminated shots discarded. |
| 4 | Button max-width / reduceMotion / Retry English / Android Brand fork | **PASS** | `BrandButtonWidth` fill/hug/compact; iOS `accessibilityReduceMotion`; Android `ANIMATOR_DURATION_SCALE`; `BrandErrorState`/`InlineErrorRetryRow` require `retryTitle`; single `android/shared/.../BrandComponents.kt`. |
| 5 | Android system bars light icons | **PASS** | `windowLightStatusBar=false`; `windowLightNavigationBar=false` (v27+); `forceDarkAllowed=false` (v29+). Screenshots show light status icons on navy. |
| 6 | Missing brand mark / Apple island / media treatment | **PASS** | Approved `BrandHelmet` / `aistroyka_helmet` on login + DesignPreview; Apple `whiteOutline` (iOS 17+) / `white` (16); `BrandMediaFrame` + badge. |
| 7 | Muddy disabled CTAs | **PASS** | Solid `actionPrimaryDisabledSolid` / `ACTION_PRIMARY_DISABLED_SOLID` + border; visible in login evidence. |
| 8 | Deferred list row / TopAppBar | **PASS** | iOS `brandListRowSurface` + `applyGlobalListChrome`; Android TopAppBar brand colors on Manager + Worker (incl. report/resubmit). |

---

## 2. Design mapping (web → mobile)

| Semantic | Web token | Value | iOS | Android |
|----------|-----------|-------|-----|---------|
| Page bg | `--aistroyka-bg-primary` | `#040A18` | `BrandTokens.bgPage` | `BG_PAGE` |
| Surface | `--aistroyka-surface` | `#101B33` | `surface` | `SURFACE` |
| Primary | `--aistroyka-accent` | `#F5C518` | `actionPrimary` | `ACTION_PRIMARY` |
| On primary | `--aistroyka-text-inverse` | `#050B1C` | `textOnPrimary` | `TEXT_ON_PRIMARY` |
| Disabled primary (solid) | (mobile affordance) | `#B89212` | `actionPrimaryDisabledSolid` | `ACTION_PRIMARY_DISABLED_SOLID` |

---

## 3. Per-screen / per-target matrix (DesignPreview)

Paths are under `.evidence/design-unification-block1-pass2/`.

| Screen | iOS Manager | iOS Worker | Android Manager | Android Worker |
|--------|-------------|------------|-----------------|----------------|
| login (clean) | `ios-manager/login-normal.png` **PASS** | `ios-worker/login-normal.png` **PASS** | `android-manager/login-normal.png` **PASS** | `android-worker/login-normal.png` **PASS** |
| first_run (separate) | `…/first_run-normal.png` **PASS** | **PASS** | **PASS** | **PASS** |
| home / dashboard | **PASS** | **PASS** | **PASS** | **PASS** |
| projects | **PASS** | **PASS** | **PASS** | **PASS** |
| tasks | **PASS** | **PASS** | **PASS** | **PASS** |
| reports | **PASS** | **PASS** | **PASS** | **PASS** |
| settings / diagnostics | **PASS** | **PASS** | **PASS** | **PASS** |
| empty | **PASS** | **PASS** | **PASS** | **PASS** |
| error | **PASS** | **PASS** | **PASS** | **PASS** |
| loading | **PASS** | **PASS** | **PASS** | **PASS** |
| offline | **PASS** | **PASS** | **PASS** | **PASS** |
| media / photo frame | **PASS** | **PASS** | **PASS** | **PASS** |
| login large a11y | `login-a11y-xl.png` **PASS** | **PASS** | `login-large-font.png` **PASS** | **PASS** |
| home large a11y | `home-a11y-xl.png` **PASS** | **PASS** | `home-large-font.png` **PASS** | **PASS** |
| settings large font | n/a (iOS a11y sample = login/home) | n/a | `settings-large-font.png` **PASS** | **PASS** |

Visual inspection notes (final pass):

- Clean login shows helmet mark + enabled yellow CTA + solid muted disabled CTA + compact toolbar control.
- `first_run` is a separate guide card, not mistaken for login.
- iOS a11y shots show enlarged Dynamic Type without system permission overlay; identity label matches target.
- Android status/nav bars are navy with light icons.

---

## 4. Commands + results

```bash
node scripts/mobile/check-mobile-brand-drift.mjs
# → self-test PASS; scan PASS

JAVA_HOME=…/jbr-17.0.14/Contents/Home
cd android && ./gradlew :shared:test :AiStroykaManager:assembleDebug :AiStroykaWorker:assembleDebug \
  :AiStroykaManager:lintDebug :AiStroykaWorker:lintDebug --no-daemon
# → BUILD SUCCESSFUL

# Isolated iOS DerivedData under .evidence/.../deriveddata-{manager,worker}
xcodebuild -scheme AiStroykaManager … test   # TEST SUCCEEDED
xcodebuild -scheme AiStroykaWorker … test    # TEST SUCCEEDED
```

Capture tooling: `scripts/mobile/capture-design-preview-evidence.sh` (isolation reboot, splash/alert/yellow validators, Android 5s settle).

Android serial used for final matrix: `emulator-5554` (Pilot_ARM64_API34); `font_scale` restored to `1.0`.

---

## 5. Key files changed (corrective pass)

**Foundation / primitives**

- `ios/Shared/Sources/Shared/Design/BrandTokens.swift`
- `ios/Shared/Sources/Shared/Design/BrandPrimitives.swift` (width variants, reduceMotion, solid disabled, BrandCard VStack, BrandMark, BrandMediaFrame, BrandErrorState)
- `ios/Shared/Sources/Shared/Design/BrandAppleSignInStyle.swift`
- `ios/Shared/Sources/Shared/Design/DesignPreviewRoot.swift`
- `ios/Shared/Sources/Shared/InlineStatusViews.swift`
- `android/shared/src/main/java/ai/aistroyka/shared/design/{BrandTokens,BrandColors,BrandComponents,DesignPreview}.kt`
- `android/shared/src/test/java/ai/aistroyka/shared/design/BrandTokensContractTest.kt`
- Themes: `android/*/res/values{,-v27,-v29}/themes.xml`
- Drift: `scripts/mobile/check-mobile-brand-drift.mjs`
- Capture: `scripts/mobile/capture-design-preview-evidence.sh`

**Feature wiring**

- iOS Manager/Worker login (BrandMark, Apple style), list chrome, ErrorStateView localized retryTitle
- Worker AppDelegate: skip push permission when `-DesignPreview`
- Android Manager/Worker login → shared Brand fields/buttons; TopAppBar colors; first-run only on login; DesignPreview via intent extra

**Not touched:** `apps/web` production code (pre-existing dirty web/security WIP preserved). No commit/push/PR.

---

## 6. Remaining / out of scope

| Item | Classification |
|------|----------------|
| Live authenticated pilot E2E screenshots (real credentials) | Out of Block-1 scope; DesignPreview covers deterministic states without auth bypass |
| Full production migration of every Material `Button` inside deep Worker submit flows | Follow-up polish; login/shell/TopAppBar/shared primitives closed; drift gate prevents system-color regressions |
| Web redesign block | Explicitly not started |
| Commit / PR / deploy | Owner-gated; not performed |

---

## 7. Closure verdict

**YES** — Block 1 corrective pass is closed for all locally controllable design/evidence items listed by the owner. Do not advance to the next design block until the owner accepts this matrix.
